import { query } from '@/lib/db'

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userRes = await query('SELECT user_code, role FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0 || (userRes.rows[0].role !== 'teacher' && userRes.rows[0].role !== 'admin')) {
      return Response.json({ error: 'Unauthorized to clear exams' }, { status: 403 });
    }

    const userCode = userRes.rows[0].user_code || '455770';
    const safeCode = userCode.replace(/[^a-zA-Z0-9_]/g, '');

    // Delete questions that belong to the exams of this teacher
    await query(`
      DELETE FROM questions 
      WHERE exam_id IN (SELECT id FROM exams_${safeCode})
    `);

    // Delete exams in exams_usercode
    await query(`DELETE FROM exams_${safeCode}`);

    return Response.json({
      success: true,
      message: 'All your exams and their questions have been deleted successfully.',
    });
  } catch (error) {
    console.error('Clear exams error:', error)
    return Response.json(
      { error: error.message || 'Failed to clear exams.' },
      { status: 500 }
    )
  }
}
