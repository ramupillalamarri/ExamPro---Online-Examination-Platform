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

                const systemPrompt = `You are Sparky, an incredibly enthusiastic, cute, and friendly AI Navigator, Tourist Guide, and Study Tutor for the ExamPro platform.
Your mission is to help users navigate the website, explain how everything works, resolve any doubts about ExamPro's features, AND act as a general tutor to solve any academic doubts, study questions, or educational concepts (especially in Mathematics, Physics, Chemistry, Computer Science, and study advice) that they might ask you!

IMPORTANT CURRENT CONTEXT:
1. User's active role: The platform has two layouts: Student (accessing "/student/*" and "/exam/*" screens) and Teacher (accessing "/admin/*" screens).
2. User's current location: The user is currently positioned on this specific page URL/pathname: "${currentPath}"
Make sure to acknowledge their current page location naturally when relevant, and relate your answers to what is visible on this screen!

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
       - "Home" link: Routes to student dashboard ("/student").
       - "Available Exams" link: Routes to the consolidated exam portal ("/student/exams").
       - "My Attempts" link: Routes to attempt logs ("/attempts").
       - "User Manual" link: Routes to manual ("/student/usermanual").
     * IF IN TEACHER/ADMIN ROLE:
       - "Dashboard" link: Routes to stats summaries ("/admin").
       - "My Exams" link: Routes to catalog & folders manager ("/admin/exams").
       - "Students" link: Routes to classroom rosters ("/admin/students").
       - "User Manual" link: Routes to teacher manual ("/admin/usermanual").
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
     * "Review Past Attempts" card: Routes to "/attempts".

6. EXAMS CATALOG & SUBJECT EXPLORER ("/student/exams"):
   - Features: A unified layout merging exams and folders! It supports two view modes:
     * "Subject Explorer" mode: Displays nested folders (subjects) and exams hierarchically at the current folder level. Features clickable breadcrumbs trail (e.g. "Root > ECET > CSE") to navigate back up, and folder cards to go deeper.
     * "All Exams" mode: Displays a flat list of all active exams, with a dropdown to filter by subject folder.
   - Core Buttons:
     * View Switcher buttons: "Subject Explorer" and "All Exams" toggle tabs.
     * Folder cards: Click to enter a folder and view its nested subfolders and exams.
     * Breadcrumb links: Click to jump back to any parent folder or the root folder.
     * "Default Exams" button (visible if user code is changed): Returns to the default teacher ("455770") catalog.
     * "Search" text input: Type to search exams. In Subject Explorer mode, typing a query automatically displays matching exams globally across all folders.
     * "Start Exam" (or "Retake Exam") button on cards: Opens the confirmation modal. Sidenote: Locked/disabled if user has already consumed their strict single attempt!

7. MY ATTEMPTS HISTORY ("/attempts"):
   - Features: Scores summary metrics, attempts table, leaderboard ranks, and search bar.
   - UI Details:
     * Rank badge: Trophy icons indicating gold (#1), silver (#2), and bronze (#3) student ranks.
     * Score progress: Inline horizontal progress bar reflecting score percentage.
     * Warnings indicator: Pulsing red warning pill count highlighting proctoring tab switches.
   - Core Buttons:
     * "Search" input bar: Filters attempts by exam title.
     * Status dropdown filter: Filters attempts by completion status (All attempts, Completed, In progress).
     * "Review Answers" button inside attempt rows: Opens the review screen ("/exam/[exam-id]/review?attempt=[attempt-id]").

8. EXAM TESTING ROOM ("/exam/[id]") - STRICT NO CHEATING MODE:
   - Sparky is automatically disabled here to enforce proctoring rules! Active testing screens block chatbot widgets.
   - Anti-cheat tracking: switching browser tabs triggers count warnings. 3 violations submits the exam automatically!

9. EXAM RESULT PAGE ("/exam/[id]/result?attempt=[attempt-id]"):
    - Features: Trophy score charts, mistake analysis, proctor warning logs, and topic recommendations.
    - Core Buttons:
      * "Review All Answers" button: Routes to "/exam/[exam-id]/review?attempt=[attempt-id]".
      * "Take Another Exam" button: Routes to "/student/exams".

10. GRADED EXAM REVIEW PAGE ("/exam/[id]/review?attempt=[attempt-id]"):
    - Features: comparative student answers vs correct answers list, and resizable split panels.
    - Core Buttons:
      - "Back" button (top header): Returns teachers to "/admin/exams" and students to "/attempts".
      - Drag handler split bar: Adjust panel dimensions. Holds the AI Tutor column on the right.

11. USER DETAILS PROFILE FORM ("/student/profile" or "/admin/profile"):
    - Features: Profile details editor (Name, Age, Phone, Address, College, Major, Graduation Year, Bio). All are completely optional!
    - Core Buttons:
      - "Back" arrow button (top header): Returns back to "/student" or "/admin".
      - "Save Details" button (bottom-right): Saves information to database.

12. TEACHER DASHBOARD HOME ("/admin"):
    - Features: High-level analytics, Horizonal bar charts, and Student Leaderboards.
    - Clickable Cards:
      - "Total Attempts" and "Avg. Score" statistics cards are clickable and route directly to the students roster "/admin/students".
    - Recent Exams Card List:
      - Click any exam row to open dynamic performance analysis ("/admin/exams/[exam-id]/analysis").
      - Click the **Quick Analyze** button next to Edit on cards to open the analytics details dialog modal inline on the dashboard.

13. MY EXAMS & NESTED FOLDERS MANAGER ("/admin/exams"):
    - Features: A unified layout merging exams, folder CRUD actions, and nested directories! It supports two view modes:
      * "Subject Explorer" mode: Manage folder trees and exams hierarchically. Shows parent breadcrumbs, subfolders list, and exams at the current folder level.
      * "All Exams" mode: Flat search table listing all exams with custom filters (status, folder).
    - Core Folder CRUD Buttons:
      - "New Folder" button (top-right of section): Opens dialog to create a subfolder inside the current active folder.
      - Folder Card Actions (dropdown menu on folders):
        * "Rename Folder": Opens edit folder name dialog.
        * "Delete Folder": Deletes the folder and all nested subfolders recursively (exams remain safe but uncategorized).
      - Folder Card click: Navigates inside the folder.
    - Core Exam Buttons:
      - "Create Exam" button (top-right of page): Opens exam configuration form. (If created inside a subfolder, it automatically starts in that folder!).
      - "Edit" icon, "Delete" icon, and Draft/Publish switch on cards/rows.
      - Card Click action: Opens '/admin/exams/[exam-id]/analysis'.

14. CLASSROOM ROSTER & STUDENTS ("/admin/students"):
    - Features: Aggregated classroom grades averages, weak topics recommendations, and student list.
    - Core Buttons:
      - "Reset Database" button: Purges all attempts, scores, and warning logs to start fresh.
      - Student name rows: Clicking a student's row opens the "Student Details Dialog" popup showing full bio, address, college, graduation year, and detailed list of exam attempts with proctor warning highlights!

15. PERFORMANCE ANALYSIS ("/admin/exams/[exam-id]/analysis"):
    - Features: Full-page statistical charts, proctor safety warnings, topic difficulty progress bars, and leaderboard table.
    - Core Buttons:
      - "Review" button in roster table: Opens "/exam/[exam-id]/review?attempt=[attempt-id]" to review that student's actual sheet.
      - "Back to Catalog" button (header): Returns back to "/admin/exams".

Guidelines for Sparky:
1. ALWAYS determine what the user is trying to accomplish (their target feature or academic query).
2. Look at their current location "${currentPath}".
3. If they ask a website navigation or feature question, provide a clear, step-by-step click manual starting from their current page path to their target page path, listing the exact button names to click!
4. State exactly where the button is located on the screen (e.g. "look at the left sidebar", "in the top-right header", "at the bottom of each card").
5. Translate website guides into extremely simple, jargon-free plain English. Use bullet lists and bold keywords.
6. If the user asks an academic doubt, study question, or educational concept explanation (e.g., in math, science, engineering, or coding):
   - Act as an encouraging, friendly AI Tutor.
   - Explain the concept clearly step-by-step, using simple definitions, analogies, and examples.
   - Highlight key terminology in bold.
   - Suggest relevant exams or folders on ExamPro they can attempt to test themselves.
   - Reiterate that Sparky is here to help solve EVERY doubt, whether it is navigation or coursework!
7. CRITICAL NAVIGATION RULES FOR USER MANUAL / ABOUT PAGE:
   - If the user is currently logged in (their location is in "/student", "/admin", "/attempts", "/exam", "/profile", or they are in the student/teacher role) and asks to go to the "About" page, "User Manual", or help guide, you MUST instruct them to click the **User Manual** link in the left sidebar (which opens "/student/usermanual" or "/admin/usermanual").
   - DO NOT tell logged-in users to look for the "About" link in the top menu or top-left header, because the top header/navigation menu only exists on the guest landing pages and is NOT visible inside the dashboard layout!`;

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
    let replyText = `Hello there, adventurer! 🤖 I'm **Sparky**, your ExamPro Guide & Tutor! 🌟\n\n`;
    
    const lowerMsg = message.toLowerCase();
    
    // 1. Check for academic concepts / study doubts first
    if (lowerMsg.includes('algebra') || lowerMsg.includes('equation') || lowerMsg.includes('x =') || lowerMsg.includes('solve')) {
      replyText += `### 🧮 Sparky's Math Corner: Solving Equations & Algebra!
Algebra is all about finding the unknown! Here is a quick guide to solving linear equations:
- **Goal**: Isolate the variable (usually **x**) on one side of the equation.
- **Golden Rule**: Whatever you do to one side of the equation, you MUST do to the other side to keep it balanced!
  - E.g., for **2x + 5 = 13**:
    1. Subtract 5 from both sides: **2x = 8**
    2. Divide both sides by 2: **x = 4**
- **Test Yourself**: Go to **Available Exams** in the left sidebar, open the **Mathematics** folder, and select **Algebra Fundamentals**!`;
    } else if (lowerMsg.includes('calculus') || lowerMsg.includes('derivative') || lowerMsg.includes('integral') || lowerMsg.includes('limit')) {
      replyText += `### 📐 Sparky's Calculus Corner: Derivatives & Integrals!
Calculus is the mathematical study of continuous change:
- **Derivatives**: Measure the rate of change at any instant (slope of a curve). E.g., the derivative of **x²** is **2x**.
- **Integrals**: Accumulate quantities over an interval (area under a curve). E.g., the integral of **2x** is **x² + C**.
- **Limits**: The value a function approaches as the input gets closer to some value.
- **Test Yourself**: Go to **Available Exams**, browse the **Mathematics** folder, and try our **Calculus Basics** exam!`;
    } else if (lowerMsg.includes('newton') || lowerMsg.includes('law') || lowerMsg.includes('force') || lowerMsg.includes('gravity') || lowerMsg.includes('physics')) {
      replyText += `### 🚀 Sparky's Physics Corner: Laws of Motion & Gravity!
Physics explains the fundamental behavior of the physical world:
- **Newton's First Law (Inertia)**: An object remains at rest or in uniform motion unless acted upon by a net external force.
- **Newton's Second Law (F = ma)**: Force equals Mass times Acceleration.
- **Newton's Third Law (Action-Reaction)**: For every action, there is an equal and opposite reaction.
- **Gravity**: Earth pulls objects with an acceleration of approximately **9.8 m/s²**.
- **Test Yourself**: Open **Available Exams** in the left sidebar, click on the **Physics** folder, and take the **Classical Mechanics** exam!`;
    } else if (lowerMsg.includes('chemistry') || lowerMsg.includes('organic') || lowerMsg.includes('hydrocarbon') || lowerMsg.includes('methane') || lowerMsg.includes('element')) {
      replyText += `### 🧪 Sparky's Chemistry Corner: Organic Compounds!
Chemistry is the science of matter, its properties, and reactions:
- **Organic Chemistry**: The study of compounds containing carbon atoms.
- **Hydrocarbons**: Compounds made solely of carbon and hydrogen (e.g., **Methane - CH₄**, which is the simplest hydrocarbon).
- **Functional Groups**: Specific atomic groups responsible for characteristic chemical behaviors (e.g., **Hydroxyl group -OH** in alcohols).
- **Test Yourself**: Go to **Available Exams**, navigate to the **Chemistry** folder, and practice **Organic Chemistry Intro**!`;
    } else if (lowerMsg.includes('doubt') || lowerMsg.includes('study') || lowerMsg.includes('learn') || lowerMsg.includes('tips') || lowerMsg.includes('tutor') || lowerMsg.includes('help')) {
      replyText += `### 📚 Sparky's Study Tips to Resolve Every Doubt!
Learning is a journey, and I'm here to help:
- **Active Recall**: Test your memory instead of passively re-reading. Start an exam on ExamPro to see where you stand!
- **Drill Weak Areas**: Use the **Detailed Performance** chart on your dashboard or review feedback from the **AI Tutor** to target topics highlighted in red or yellow.
- **Spaced Repetition**: Re-take exams after a few days to consolidate concepts in long-term memory.
- **AI Tutor Review Panel**: Remember, on any graded exam review page, you can drag the splitter to reveal the **AI Tutor** on the right side. You can ask it to explain any specific question doubt!`;
    } else if (lowerMsg.includes('about') || lowerMsg.includes('manual') || lowerMsg.includes('guide')) {
      replyText += `### 📖 How to Access the User Manual & About Page!
`;
      if (currentPath.startsWith('/student') || currentPath.startsWith('/attempts') || currentPath.includes('/exam') || currentPath.includes('/profile')) {
        replyText += `Since you are currently logged in as a student:
- Click the **User Manual** link in the left sidebar.
- This will open the user guide directly inside your dashboard (at **/student/usermanual**)!
- There is no top menu header visible while you are logged in to your student dashboard.`;
      } else if (currentPath.startsWith('/admin')) {
        replyText += `Since you are currently logged in as a teacher/admin:
- Click the **User Manual** link in the left sidebar.
- This will open the teacher manual directly inside your dashboard (at **/admin/usermanual**)!
- There is no top menu header visible while you are logged in to your teacher dashboard.`;
      } else {
        replyText += `If you are logged out (on the landing page):
- Look at the top header menu and click the **About** link.
- If you are on the manual page itself, you can read it directly or click **Get Started** at the bottom to log in!`;
      }
    } else {
      // 2. Otherwise, fallback to path-specific navigation guides
      replyText += `I couldn't reach my main AI servers right now, but I still know exactly where you are! I see you are visiting: **${currentPath}**! 🧭\n\n`;

      if (currentPath === '/') {
        replyText += `### 🏡 Welcome to the Landing Page!
Here is what you see on this page:
- A gorgeous floating header at the top.
- A list of amazing features of ExamPro (like our AI Tutor, detailed performance charts, and anti-cheat warning systems).
- Live counters showing active students and exam stats!
- A **Get Started** button leading to login.
- An **About** button in the header leading to our full manual directory!

**How to navigate from here:**
- **To log in:** Click the **Get Started** or **Login** button at the top header.
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
- **To take an exam:** Click **Browse Available Exams** on the screen OR click **Available Exams** in the left sidebar.
- **To view past scores:** Click **Review Past Attempts** on the screen OR click **My Attempts** in the left sidebar.
- **To edit profile details:** Click your name at the bottom of the left sidebar, and choose **Details**!`;
      } else if (currentPath.includes('/student/exams')) {
        replyText += `### 🎒 Welcome to the Available Exams & Subject Explorer!
This unified page lets you browse folder hierarchies and start exams:
- **Switch Views:** Toggle between **Subject Explorer** (tree/directory navigation) and **All Exams** (flat search list) in the top-left.
- **Browse Folders:** Click any folder card (e.g. ECET, CSE) to navigate deeper. Use the clickable breadcrumbs at the top of the section to go back up!
- **Search:** Search exams globally by title using the search input at the top.
- **🔑 Teacher Code:** If the catalog is empty, enter your teacher's 6-digit access code (e.g., **455770**) in the sidebar code box to load their exams!

**How to navigate from here:**
- **To start an exam:** Click **Start Exam** on any exam card.
- **To navigate folder trees:** Click on any folder card, or use the breadcrumbs at the top of the folders section to navigate back to parent folders.
- **To view attempts history:** Click **My Attempts** in the left sidebar.`;
      } else if (currentPath.includes('/attempts')) {
        replyText += `### 📝 Welcome to your Attempt History!
On this page, you can:
- View a beautiful table of all your past attempts.
- Check your final scores, percentage marks, and any cheating warnings triggered (tab switches) highlighted in red pills.
- See your dynamic Rank Badge trophies (#1, #2, #3) based on class leaderboards.
- Click the **Review Answers** button to go to the graded review screen and chat with the AI Tutor!
- Filter leaderboard ranks using the search bar inside the leaderboard card.

**How to navigate from here:**
- **To review a test:** Click the **Review Answers** button next to your desired attempt in the attempts list.
- **To go back to exams:** Click **Available Exams** in the left sidebar.
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
  - **Sidenote:** Clicking "Total Attempts" or "Avg. Score" routes you directly to the classroom roster!
- A list of recent exam activities and student leaderboard ranks.
  - Click **Quick Analyze** on any recent exam row to trigger the performance analysis modal dialog inline on this page!
  - Click **Edit** to update exam configurations.
- Click any recent exam card row container to open its full-performance analysis page!

**How to navigate from here:**
- **To view dynamic exam charts:** Click on any exam card under the "Recent Exams" grid.
- **To manage exams & folders:** Click **My Exams** in the left sidebar.
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
          replyText += `### 🗂️ Welcome to My Exams & Nested Folders Manager!
This consolidated screen allows you to manage both exams and nested subject directories:
- **Switch Views:** Toggle between **Subject Explorer** (manage directory trees and create/rename/delete folders) and **All Exams** (flat search list with status filters) in the top-left.
- **Breadcrumbs:** Click breadcrumb links at the top of the explorer to jump up to parent folders.
- **Create Folders:** Click **New Folder** (top-right of the folder/subject section) to create a folder or subfolder inside the current path.
- **Folder Settings:** Click the three dots icon next to any folder card to **Rename** or **Delete** it (all nested subfolders will be deleted, and exams inside will become uncategorized).
- **Create Exam:** Click **Create Exam** (top-right of the page) to build a new exam. (Exams created inside a folder will be pre-assigned to it!).

**How to navigate from here:**
- **To build a new test:** Click the **Create Exam** button in the top-right corner.
- **To view metrics:** Click on any exam row or card container.
- **To toggle drafts:** Click the **Published** switch on each card/row.`;
        }
      } else if (currentPath.includes('/admin/students')) {
        replyText += `### 👥 Welcome to the Students Classroom Roster!
On this page, you can:
- View classroom statistics and average scores.
- Check topic alerts for topics where students struggled.
- Click any student row to open the **Student Details Dialog** popup displaying their biography, college, address, and attempt warning details!
- Click **Reset Database** to flush proctoring attempts and warning logs.`;
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
        if (lowerMsg.includes('profile') || lowerMsg.includes('detail') || lowerMsg.includes('name') || lowerMsg.includes('edit')) {
          replyText += `### 🎒 How to Edit Your Profile & Details:
1. Look at the bottom of the left sidebar and click on your **Name**.
2. In the popup dropdown menu, click **Details**.
3. Fill in any details you like (Name, Age, Phone, Address, College, Major, Graduation, Bio).
4. Click the green **Save Details** button!`;
        } else if (lowerMsg.includes('exam') || lowerMsg.includes('attempt') || lowerMsg.includes('start') || lowerMsg.includes('limit')) {
          replyText += `### 📝 How to Attempt Exams:
1. Click **Available Exams** in the left sidebar.
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
* **Are you a Student?** Go to **Available Exams** to start, and **My Attempts** to review answers and see leaderboards.
* **Are you a Teacher?** Visit **My Exams** to create folders/exams, click them to view full-page analytics, or go to **Students** for classroom insights.
* **To edit details:** Click your name in the bottom-left sidebar, then click **Details**!

Tell me what you are looking for, and I'll route you there! 🚀`;
        }
      }
    }

    return NextResponse.json({ reply: replyText, usedGroq: false, groqModel, groqError });
  } catch (error) {
    console.error('Tourist Guide API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
