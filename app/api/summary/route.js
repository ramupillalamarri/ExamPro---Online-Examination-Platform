import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

function quoteIdentifier(name) {
  return '"' + name.replace(/"/g, '""') + '"'
}

export async function GET() {
  try {
    const examTables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'exams\\_%'
    `)

    const folderTables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'folders\\_%'
    `)

    let totalExams = 0
    for (const row of examTables.rows) {
      const tableName = row.table_name
      const countRes = await query(`SELECT COUNT(*)::integer as count FROM ${quoteIdentifier(tableName)}`)
      totalExams += countRes.rows[0]?.count ?? 0
    }

    let totalFolders = 0
    for (const row of folderTables.rows) {
      const tableName = row.table_name
      const countRes = await query(`SELECT COUNT(*)::integer as count FROM ${quoteIdentifier(tableName)}`)
      totalFolders += countRes.rows[0]?.count ?? 0
    }

    return NextResponse.json({ totalExams, totalFolders })
  } catch (error) {
    console.error('GET Summary Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
