import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req) {
  try {
    const payload = await req.json();
    const message = payload.message || '';
    const chatHistory = Array.isArray(payload.chatHistory) ? payload.chatHistory : [];
    const currentPath = payload.currentPath || '/';

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    let groqError = null;

    if (apiKey) {
      try {
        const groq = new Groq({ apiKey, timeout: 15000 });

        const historyMessages = chatHistory
          .filter((entry) => entry && entry.role && entry.content)
          .map((entry) => ({ role: entry.role, content: entry.content }));

        const systemPrompt = `You are Sparky, an incredibly enthusiastic, cute, and friendly AI Tourist Guide and Navigator for the ExamPro platform.
Your mission is to help users navigate the website, explain how everything works, and resolve any doubts about ExamPro's features.

IMPORTANT CURRENT CONTEXT:
1. User's active role: The platform has two layouts: Student (accessing "/student/*" and "/exam/*" screens) and Teacher (accessing "/admin/*" screens).
2. User's current location: The user is currently positioned on this specific page URL/pathname: "${currentPath}"
Make sure to acknowledge their current page location naturally and relate your answers to what is visible on this screen!

Official Guide Directory - Know every feature, button, route, and precise navigation step:

1. GUEST LANDING PAGE ("/") / HOME FOR LOGGED OUT USERS:
   - Features: Shows animated headers, detailed capabilities (AI Tutors, dynamic analytics), and satisfaction counters.
   - Core Buttons:
     * "Get Started" button (centered): Redirects to "/login" to sign in.
     * "About" item (top header menu): Links to the user manual page ("/about").
     * "Login" item (top header menu): Links to "/login".
   - Navigation: If you want to log in, click the "Get Started" or "Login" button. If you want to read the user manual, click the "About" link in the top menu.

2. ABOUT MANUAL PAGE ("/about"):
   - Features: Role-specific student and teacher guides, proctoring specs, and FAQs.
   - Core Buttons:
     * "Back to Home" logo link (top-left header): Returns back to "/".
     * "Get Started" button (bottom of page): Routes to "/login".
   - Navigation: Read through the manual blocks to understand how things work! To login, click "Get Started" at the bottom.

3. LOGIN GATEWAY ("/login"):
   - Features: Sign-in options.
   - Core Buttons:
     * "Sign in with Google" button: Logs in utilizing Google identity credentials. Assigns the "student" role by default and redirects to "/student".
     * "Mock Login" button: Fallback panel to log in without credentials for testing.

4. THE PERSISTENT SIDEBAR NAVIGATION (Rendered globally on all student "/student/*" and teacher "/admin/*" routes):
   - Features: sticky left navigation containing access codes and account configurations.
   - Core Sidebar Buttons:
     * IF IN STUDENT ROLE:
       - "Exams Catalog" link: Routes to the exam portal ("/student/exams").
       - "My Attempts" link: Routes to attempt logs ("/student/history").
     * IF IN TEACHER/ADMIN ROLE:
       - "Dashboard" link: Routes to stats summaries ("/admin").
       - "My Exams" link: Routes to catalog manager ("/admin/exams").
       - "Folders" link: Routes to subject folders manager ("/admin/folders").
       - "Students" link: Routes to student classroom rosters ("/admin/students").
     * GLOBAL SIDEBAR BOTTOM CONTROLS:
       - "User Code" input box: Students can type a teacher's 6-digit access code (default "455770") and press Enter to load that teacher's catalog.
       - User Name Card button (bottom-left): Displays active name. Click to open a dropdown popup:
         * "Details" button (User icon row): Routes to the optional Profile details form ("/student/profile" or "/admin/profile").
         * "Switch Role" button (swap arrows row): Toggles active role between Student and Teacher instantly and routes to "/student" or "/admin".
         * "Sign Out" button (red row): Deletes credentials/conversations and redirects to "/login".

5. STUDENT PORTAL HOME ("/student"):
   - Features: Quick summary metrics and welcome cards.
   - Core Buttons:
     * "Browse Available Exams" card: Routes to "/student/exams".
     * "Review Past Attempts" card: Routes to "/student/history".

6. EXAMS CATALOG ("/student/exams"):
   - Features: Subject categories and exam grid.
   - Core Buttons:
     * Subject Folder pills (e.g. "Mathematics", "Calculus"): Click to filter exams list.
     * "Search" text input: Type to search exams dynamically.
     * "Start Exam" (or "Retake Exam") button on cards: Opens the confirmation modal.
       - Sidenote: Locked/disabled if user has already consumed their strict single attempt!
       - Sidenote: If list is empty, type teacher code "455770" in the sidebar input box to unlock exams!

7. MY ATTEMPTS HISTORY ("/student/history"):
   - Features: Scores summary metrics, attempts table, leaderboard ranks, and search bar.
   - Core Buttons:
     * "Search" input bar: Filters attempts by exam title.
     * "Review Answers" button inside attempt rows: Opens the review screen ("/exam/[exam-id]/review?attempt=[attempt-id]").
     * Leaderboard search input (inside leaderboard widget): Filters dynamic ranks by student email.

8. EXAM TESTING ROOM ("/exam/[id]") - STRICT NO CHEATING MODE:
   - Sparky is automatically disabled here to enforce proctoring rules! If users ask about it, remind them that active testing screens block chatbot widgets to ensure zero cheating warnings.
   - Anti-cheat tracking: switching browser tabs triggers count warnings. 3 violations submits the exam automatically!

9. EXAM RESULT PAGE ("/exam/[id]/result?attempt=[attempt-id]"):
   - Features: Trophy score charts and warnings report.
   - Core Buttons:
     * "Review Graded Answers" button: Routes to "/exam/[exam-id]/review?attempt=[attempt-id]".
     * "Back to Dashboard" button: Routes to "/student".

10. GRADED EXAM REVIEW PAGE ("/exam/[id]/review?attempt=[attempt-id]"):
    - Features: comparative student answers vs correct answers list, and resizable split panels.
    - Core Buttons:
      - "Back" button (top header): Returns teachers to "/admin/exams" and students to "/student/history".
      - Drag handler split bar: Adjust panel dimensions. Holds the AI Tutor column on the right.

11. USER DETAILS PROFILE FORM ("/student/profile" or "/admin/profile"):
    - Features: Optional profile details editor.
    - Core Buttons:
      - "Back" arrow button (top header): Returns back to "/student" or "/admin".
      - Input fields: Name, Age, Phone, Address, College, Major, Graduation Year, Bio. All are completely optional!
      - "Save Details" button (bottom-right): Saves information to postgres DB and triggers a toast notification.

12. TEACHER DASHBOARD HOME ("/admin"):
    - Features: High-level classroom charts (Total exams, students, class averages).
    - Core Buttons:
      - Recent activity exam card rows: Click to open dynamic performance analysis ("/admin/exams/[exam-id]/analysis").

13. MY EXAMS MANAGER ("/admin/exams"):
    - Features: Exams publisher catalog.
    - Core Buttons:
      - "Create Exam" button (top-right): Opens exam configuration form.
      - "Edit" icon, "Delete" icon, and Draft/Publish switch on cards.
      - Card Click action: Clicking any exam card row opens '/admin/exams/[exam-id]/analysis'.

14. FOLDERS BUILDER ("/admin/folders"):
    - Features: Category groups builder.
    - Core Buttons:
      - "Create Folder" button: Opens naming form.
      - Folder cards: Click to redirect to '/admin/exams?folderId=[id]' to show draft and published exams in that folder.

15. CLASSROOM ROSTER & STUDENTS ("/admin/students"):
    - Features: Real-time class grades averages, weak topics recommendations (polls every 5s), and roster list.
    - Core Buttons:
      - "Reset Database" button: Purges all attempts, scores, and warning logs to start fresh.
      - Student name rows: Clicking a student's row opens the "Student Details Dialog" popup showing full bio, address, college, graduation year, and detailed list of exam attempts with proctor warning highlights!

16. PERFORMANCE ANALYSIS ("/admin/exams/[exam-id]/analysis"):
    - Features: Full-page statistical analytics, rank metrics, topic difficulty progress bars (Red = weak, Amber = medium, Green = mastery), proctor safety warnings, and search roster bar.
    - Core Buttons:
      - "Review" button in roster table: Opens "/exam/[exam-id]/review?attempt=[attempt-id]" to review that student's actual sheet full-width (AI Tutor hidden for teachers).
      - "Back to Catalog" button (header): Returns back to "/admin/exams".

Guidelines for Sparky:
1. ALWAYS determine what the user is trying to accomplish (their target feature).
2. Look at their current location "${currentPath}".
3. Provide a clear, step-by-step click manual starting from their current page path to their target page path, listing the exact button names to click!
4. State exactly where the button is located on the screen (e.g. "look at the left sidebar", "in the top-right header", "at the bottom of each card").
5. Translate everything into extremely simple, jargon-free plain English. Use bullet lists and bold keywords.`;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: message },
        ];

        const completion = await groq.chat.completions.create({
          messages,
          model: groqModel,
          temperature: 0.7,
        });

        const text = completion.choices?.[0]?.message?.content || '';
        return NextResponse.json({ reply: text, usedGroq: true, groqModel });
      } catch (err) {
        groqError = err instanceof Error ? err.message : String(err);
        console.error('Groq Tourist Guide API failed:', err);
      }
    }

    // High-fidelity fallback explanation if Groq is offline/unconfigured
    let replyText = `Hello there, adventurer! 🤖 I'm **Sparky**, your ExamPro Tourist Guide! 🌟\n\nI couldn't reach my main AI servers right now, but I still know exactly where you are! I see you are visiting: **${currentPath}**! 🧭\n\n`;
    
    // Check path-specific guides first
    if (currentPath === '/') {
      replyText += `### 🏡 Welcome to the Landing Page!
Here is what you see on this page:
- A gorgeous floating header at the top.
- A list of amazing features of ExamPro (like our AI Tutor, detailed performance charts, and anti-cheat warning systems).
- Live counters showing active students and exam stats!
- A **Get Started** button leading to login.
- An **About** button in the header leading to our full manual directory!

**How to navigate from here:**
- **To log in:** Click the red **Get Started** or **Login** button at the top header.
- **To view manual:** Click the **About** link in the top menu.`;
    } else if (currentPath === '/about') {
      replyText += `### 📖 Welcome to the Official User Manual!
This page serves as a complete manual directory:
- Scroll down to read the **Student Guide** on how to enter teacher codes, start exams, and chat with the AI Tutor.
- Read the **Teacher Guide** on how to organize exams in folders, view dynamic roster stats, and check full-page performance analysis.
- Browse frequently asked questions to clear up any doubts!

**How to navigate from here:**
- **To log in:** Scroll to the bottom and click the **Get Started** button!
- **To go back:** Click the **Logo** in the top-left corner.`;
    } else if (currentPath === '/student') {
      replyText += `### 🎓 Welcome to the Student Home Portal!
Here you can see:
- A warm welcome banner!
- Quick cards to jump directly to **Available Exams** or view **My Attempts**.
- A high-level summary of your active metrics. Let's start an exam! 🚀

**How to navigate from here:**
- **To take an exam:** Click **Browse Available Exams** on the screen OR click **Exams Catalog** in the left sidebar.
- **To view past scores:** Click **Review Past Attempts** on the screen OR click **My Attempts** in the left sidebar.
- **To edit profile details:** Click your name at the bottom of the left sidebar, and choose **Details**!`;
    } else if (currentPath.includes('/student/exams')) {
      replyText += `### 🎒 Welcome to the Exams Catalog!
On this page, you can:
- Filter exams using the subject folders (e.g. Mathematics, Calculus) at the top!
- Search for specific exams using the search bar.
- **🔑 Teacher Code Required:** If the list is empty, type your teacher's 6-digit access code (try default **455770**) in the sidebar entry box to load the catalog!
- **Strict 1-Attempt Limit:** You can only start each exam once. The button locks once submitted!

**How to navigate from here:**
- **To start an exam:** Click **Start Exam** on any card.
- **To unlock more exams:** Look at the left sidebar, locate the **Teacher Access Code** input field, type **455770** and press Enter.
- **To view past scores:** Click **My Attempts** in the left sidebar.`;
    } else if (currentPath.includes('/student/history')) {
      replyText += `### 📝 Welcome to your Attempt History!
On this page, you can:
- View a beautiful table of all your past attempts.
- Check your final scores, percentage marks, and any cheating warnings triggered (tab switches).
- Click the **Review Answers** button to go to the graded review screen and chat with the AI Tutor!
- Filter leaderboard ranks using the search bar inside the leaderboard card.

**How to navigate from here:**
- **To review a test:** Click the **Review Answers** button next to your desired attempt in the attempts list.
- **To go back to exams:** Click **Exams Catalog** in the left sidebar.
- **To toggle role to teacher:** Click your name in the bottom-left sidebar, then click **Switch Role**!`;
    } else if (currentPath.includes('/profile')) {
      replyText += `### 👤 Welcome to your Personal Details Profile!
On this page, you can:
- Fill out a private profile form including Name, Age, Email, Phone, Address, College, Major, Graduation, and Bio.
- **Note:** Filling every single detail is completely optional!
- Click the **Save Details** button at the bottom to sync your details safely with the database.

**How to navigate from here:**
- **To save profile details:** Fill in any text input and click **Save Details** (a green success toast will appear!).
- **To exit:** Click the **Back** arrow button in the top-left header.`;
    } else if (currentPath === '/admin') {
      replyText += `### 📊 Welcome to the Teacher Dashboard!
Here is what you see on this page:
- Administrative statistics cards showing total exams, students, average class grades, and folders count.
- A list of recent exam activities and student leaderboard ranks.
- Click any recent exam card row to open its full-performance analysis page!

**How to navigate from here:**
- **To view dynamic exam charts:** Click on any exam card under the "Recent Exams" grid.
- **To create folders:** Click **Folders** in the left sidebar.
- **To inspect student rosters:** Click **Students** in the left sidebar.`;
    } else if (currentPath.includes('/admin/exams')) {
      if (currentPath.includes('/analysis')) {
        replyText += `### 📈 Welcome to the Performance Analysis Page!
This full-screen analytics dashboard provides:
- Visual metric charts showing attempts count, average score, range, and pass rate.
- Live topic-by-topic difficulty progress bars (green = mastery, amber = intermediate, red = weak topics).
- A full list of student ranks and scores in the leaderboard!

**How to navigate from here:**
- **To inspect student sheet:** Click the **Review** button next to a student's attempt row in the leaderboard.
- **To return:** Click the **Back to Catalog** button in the top-left header.`;
      } else {
        replyText += `### 🗂️ Welcome to My Exams Catalog!
On this page, you can:
- Click the **Create Exam** button to build a new exam.
- Click on any exam card to open its detailed Performance Analysis.
- Toggle the publication switch (Draft vs Published) to show/hide exams for students.

**How to navigate from here:**
- **To build a new test:** Click the **Create Exam** button in the top-right corner.
- **To view metrics:** Click on any exam card container.
- **To toggle drafts:** Click the **Published** switch on each card.`;
      }
    } else if (currentPath.includes('/admin/folders')) {
      replyText += `### 📁 Welcome to the Folders Manager!
On this page, you can:
- Click the **Create Folder** builder button to add subject groupings.
- View subject cards showing the number of exams inside each folder.
- Click a folder card to redirect to the exams page, pre-filtered for that folder!

**How to navigate from here:**
- **To create subject folder:** Click the **Create Folder** button in the top-right.
- **To view exams inside:** Click on the folder card itself (e.g. Mathematics).`;
    } else if (currentPath.includes('/admin/students')) {
      replyText += `### 👥 Welcome to the Students Classroom Roster!
On this page, you can:
- View aggregated classroom performance averages (score, attempt counts, warnings count).
- Browse the weak topic cards pointing out subjects where students struggled.
- See the list of all students. **Sidenote:** Roster data polls automatically every 5 seconds to stay perfectly updated!

**How to navigate from here:**
- **To view student details:** Click on any student's name row. A gorgeous popup details form and attempts history will open!
- **To wipe test data:** Click the red **Reset Database** button in the top-right corner.`;
    } else if (currentPath.includes('/review')) {
      replyText += `### ✨ Welcome to the Graded Exam Review!
Here is what is visible:
- A question-by-question comparative breakdown showing your selected answer vs the correct answer.
- A student email badge in the header if viewed by a teacher.
- A premium resizable **AI Tutor** column on the right side. You can chat with it to clear up any question doubts, and it keeps separate chat histories for each question!

**How to navigate from here:**
- **To return:** Click the **Back** arrow in the top-left header.`;
    } else {
      // General fallbacks if path not matched
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('profile') || lowerMsg.includes('detail') || lowerMsg.includes('name') || lowerMsg.includes('edit')) {
        replyText += `### 🎒 How to Edit Your Profile & Details:
1. Look at the bottom of the left sidebar and click on your **Name**.
2. In the popup dropdown menu, click **Details**.
3. Fill in any details you like (Name, Age, Phone, Address, College, Major, Graduation, Bio).
4. Click the green **Save Details** button!`;
      } else if (lowerMsg.includes('exam') || lowerMsg.includes('attempt') || lowerMsg.includes('start') || lowerMsg.includes('limit')) {
        replyText += `### 📝 How to Attempt Exams:
1. Click **Exams Catalog** in the left sidebar.
2. If list is empty, click the **Teacher Access Code** input field in the sidebar, type **455770** and press Enter.
3. Click the **Start Exam** button on the exam card.
4. Remember: the platform enforces a **strict 1-attempt limit**! Once submitted, the button will lock.`;
      } else if (lowerMsg.includes('teacher') || lowerMsg.includes('code') || lowerMsg.includes('unlock') || lowerMsg.includes('455770')) {
        replyText += `### 🔑 Using a Teacher Access Code:
1. Locate the **Teacher Access Code** input field in the sidebar.
2. Type **455770** and press Enter.
3. The exams catalog list will immediately update with the teacher's active exams!`;
      } else if (lowerMsg.includes('tutor') || lowerMsg.includes('ai') || lowerMsg.includes('chat') || lowerMsg.includes('review')) {
        replyText += `### ✨ Reviewing Exams & the AI Tutor:
1. Click **My Attempts** in the student sidebar.
2. Click **Review Answers** next to your attempt.
3. The review screen features a draggable, resizable vertical split pane.
4. The **AI Tutor** occupies the right panel and provides separate chat histories for each question!`;
      } else if (lowerMsg.includes('teacher') || lowerMsg.includes('admin') || lowerMsg.includes('analysis') || lowerMsg.includes('folder')) {
        replyText += `### 🎓 Teacher & Admin Controls:
1. Click your **Name** at the bottom-left sidebar, then click **Switch Role** to enter Teacher Mode.
2. Go to **My Exams** to manage tests, or click them to view **Performance Analysis** details (ranks, progress charts, warnings, and leaderboards!).
3. Go to **Students** to view classroom statistics and click student rows to open their profiles.`;
      } else {
        replyText += `### 🧭 Quick Navigation Manual:
* **Are you a Student?** Go to **Exams Catalog** to start, and **My Attempts** to review answers and see leaderboards.
* **Are you a Teacher?** Visit **My Exams** to create folders/exams, click them to view full-page analytics, or go to **Students** for aggregated classroom insights.
* **To edit details:** Click your name in the bottom-left sidebar, then click **Details**!

Tell me what you are looking for, and I'll route you there! 🚀`;
      }
    }

    return NextResponse.json({ reply: replyText, usedGroq: false, groqModel, groqError });
  } catch (error) {
    console.error('Tourist Guide API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
