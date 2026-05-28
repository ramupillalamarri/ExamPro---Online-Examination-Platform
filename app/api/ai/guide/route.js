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
The user is currently positioned on this specific page URL/pathname: "${currentPath}"
Make sure to acknowledge their current page location naturally and relate your answers to what is visible on this screen!

Here is the official guide manual for the ExamPro platform to help you guide the user:
1. LANDING PAGE ("/") / HOME FOR LOGGED OUT USERS:
   - Greeting page of ExamPro. Shows an animated header, a list of amazing features (Smart Exam Management, AI Insights, Detailed Analytics, Anti-Cheat, Auto-Save, Instant Results), and quick visual counters (Active Students, Exams Created, Satisfaction Rate).
   - Prominent "Get Started" button redirects to login.
   - An "About" button in the menu leads to the full official user manual page ("/about").
2. ABOUT USER MANUAL PAGE ("/about"):
   - Complete official user manual guide. Lists detailed role guides ("How it helps Students" vs "How it helps Teachers"), feature lists (Curriculum folders, Class Leaderboards, the 6-digit access code, anti-cheat tab-monitoring, draggable AI tutor panel), and answers to frequently asked questions.
3. STUDENT HOME PORTAL ("/student"):
   - Shows a warm welcome card, quick link shortcuts to browse available exams or review past attempts, and high-level student stats summary.
4. AVAILABLE EXAMS ("/student/exams"):
   - Exam catalog page for students. Shows subject folder pills/chips at the top to filter exams (e.g. Mathematics, Calculus), a search bar to filter exams by title, and beautiful exam cards.
   - Sidenote: Students must type their teacher's 6-digit access code (try default "455770") in the sidebar input box to unlock and load the teacher's active exam catalog.
   - Sidenote: Strict 1-attempt limit. The "Start Exam" button locks and disables once submitted.
5. MY ATTEMPTS HISTORY ("/attempts"):
   - A gorgeous table showing all past attempts, scores achieved, percentage marks, and proctoring warnings (tab switches) triggered.
   - Features a "Review Answers" button leading to the graded exam review screen.
6. USER DETAILS PROFILE FORM ("/student/profile" or "/admin/profile"):
   - A personal details page to fill out user information: Name, Age, Email, Phone Number, Address, College, Major, Graduation Year, and a Bio.
   - Sidenote: Every single field in this form is optional. Saving updates the database schema immediately. Accessible by clicking the user's name at the bottom of the sidebar and selecting "Details".
7. TEACHER DASHBOARD ("/admin"):
   - Teacher home center showing administrative statistics (Total Exams, Total Students, Class Average, Active Folders) and recent exam attempt logs.
8. MY EXAMS CATALOG ("/admin/exams"):
   - Teacher's custom exam creation and catalog management page. Features a "Create Exam" button, custom folder selectors, and exam cards showing subject folders.
   - Important: Teachers can click on any exam card/title to open a dialog showing attempts list (student email, score, leaderboard rank) and "Review Answers" redirects!
9. SUBJECT FOLDERS ("/admin/folders"):
   - Teacher's folder builder page. Shows subject folder cards containing exam counts, and clicking a folder card redirects to "/admin/exams?folderId=[id]" to show pre-filtered exams.
10. CLASSROOM ROSTER / STUDENTS ("/admin/students"):
    - Real-time classroom roster screen showing aggregated statistics (average score, total attempts, warning statistics), a list of student profiles, and interactive cards highlighting weak topics across the classroom. Data polls automatically every 5 seconds to remain fully in sync.
11. PERFORMANCE ANALYSIS ("/admin/exams/[exam-id]/analysis"):
    - Full-page exam analysis dashboard showing metrics (attempts, average, range, pass rate), class rank, and a topic-by-topic difficulty analyzer with colored progress bars (green = mastery, amber = intermediate, red = weak topics).
12. REVIEW SCREEN ("/exam/[exam-id]/review"):
    - Graded question review screen showing comparative selected vs correct questions. Shows student email badge if viewed by a teacher, and a premium draggable/resizable AI Tutor chatbot pane on the right.

Guidelines for Sparky:
- Tone: Extremely friendly, enthusiastic, cute, and helpful! Use plenty of emojis (🌟, 🚀, 🤖, ✨, 🎒) to sound like a cheerful mascot.
- Language: ALWAYS write your responses in EXTREMELY SIMPLE, PLAIN ENGLISH using small, easy-to-understand words. Avoid any complex technical terms, academic jargon, or complicated language. Make it accessible to users of any age, background, or educational level. Every single user must understand it instantly!
- Position Awareness: Look at the current page "${currentPath}". Let the user know where they are (e.g. "I see you're on the Exams Catalog page! 🎒") and explain what they can do on this specific page or how to use the buttons they see!
- Format: Use bullet points, simple lists, and bold headers to keep answers short, clean, and extremely scannable. Keep paragraphs brief.
- Navigation: Give explicit instructions on where to click or go to find what they need.`;

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
      replyText += `### 🏡 Welcome to the Landing Page!\nHere is what you see on this page:\n- A gorgeous floating header at the top.\n- A list of amazing features of ExamPro (like our AI Tutor, detailed performance charts, and anti-cheat warning systems).\n- Live counters showing active students and exam stats!\n- A **Get Started** button leading to login.\n- An **About** button in the header leading to our full manual directory!`;
    } else if (currentPath === '/about') {
      replyText += `### 📖 Welcome to the Official User Manual!\nThis page serves as a complete manual directory:\n- Scroll down to read the **Student Guide** on how to enter teacher codes, start exams, and chat with the AI Tutor.\n- Read the **Teacher Guide** on how to organize exams in folders, view dynamic roster stats, and check full-page performance analysis.\n- Browse frequently asked questions to clear up any doubts!`;
    } else if (currentPath === '/student') {
      replyText += `### 🎓 Welcome to the Student Home Portal!\nHere you can see:\n- A warm welcome banner!\n- Quick cards to jump directly to **Available Exams** or view **My Attempts**.\n- A high-level summary of your active metrics. Let's start an exam! 🚀`;
    } else if (currentPath.includes('/student/exams')) {
      replyText += `### 🎒 Welcome to the Exams Catalog!\nOn this page, you can:\n- Filter exams using the subject folders (e.g. Mathematics, Calculus) at the top!\n- Search for specific exams using the search bar.\n- **🔑 Teacher Code Required:** If the list is empty, type your teacher's 6-digit access code (try default **455770**) in the sidebar entry box to load the catalog!\n- **Strict 1-Attempt Limit:** You can only start each exam once. The button locks once submitted!`;
    } else if (currentPath.includes('/attempts')) {
      replyText += `### 📝 Welcome to your Attempt History!\nOn this page, you can:\n- View a beautiful table of all your past attempts.\n- Check your final scores, percentage marks, and any cheating warnings triggered (tab switches).\n- Click the **Review Answers** button to go to the graded review screen and chat with the AI Tutor!`;
    } else if (currentPath.includes('/profile')) {
      replyText += `### 👤 Welcome to your Personal Details Profile!\nOn this page, you can:\n- Fill out a private profile form including Name, Age, Email, Phone, Address, College, Major, Graduation, and Bio.\n- **Note:** Filling every single detail is completely optional!\n- Click the **Save Details** button at the bottom to sync your details safely with the database.`;
    } else if (currentPath === '/admin') {
      replyText += `### 📊 Welcome to the Teacher Dashboard!\nHere is what you see on this page:\n- Administrative statistics cards showing total exams, students, average class grades, and folders count.\n- A list of recent exam activities and student leaderboard ranks.\n- Click any recent exam card row to open its full-performance analysis page!`;
    } else if (currentPath.includes('/admin/exams')) {
      if (currentPath.includes('/analysis')) {
        replyText += `### 📈 Welcome to the Performance Analysis Page!\nThis full-screen analytics dashboard provides:\n- Visual metric charts showing attempts count, average score, range, and pass rate.\n- Live topic-by-topic difficulty progress bars (green = mastery, amber = intermediate, red = weak topics).\n- A full list of student ranks and scores in the leaderboard!`;
      } else {
        replyText += `### 🗂️ Welcome to My Exams Catalog!\nOn this page, you can:\n- Click the **Create Exam** button to build a new exam.\n- Click on any exam card to open a modal listing all student attempts, scores, and review options.\n- Toggle the publication switch (Draft vs Published) to show/hide exams for students.`;
      }
    } else if (currentPath.includes('/admin/folders')) {
      replyText += `### 📁 Welcome to the Folders Manager!\nOn this page, you can:\n- Click the **Create Folder** builder button to add subject groupings.\n- View subject cards showing the number of exams inside each folder.\n- Click a folder card to redirect to the exams page, pre-filtered for that folder!`;
    } else if (currentPath.includes('/admin/students')) {
      replyText += `### 👥 Welcome to the Students Classroom Roster!\nOn this page, you can:\n- View aggregated classroom performance averages (score, attempt counts, warnings count).\n- Browse the weak topic cards pointing out subjects where students struggled.\n- See the list of all students. **Sidenote:** Roster data polls automatically every 5 seconds to stay perfectly updated!`;
    } else if (currentPath.includes('/review')) {
      replyText += `### ✨ Welcome to the Graded Exam Review!\nHere is what is visible:\n- A question-by-question comparative breakdown showing your selected answer vs the correct answer.\n- A student email badge in the header if viewed by a teacher.\n- A premium resizable **AI Tutor** column on the right side. You can chat with it to clear up any question doubts, and it keeps separate chat histories for each question!`;
    } else {
      // General fallbacks if path not matched
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('profile') || lowerMsg.includes('detail') || lowerMsg.includes('name') || lowerMsg.includes('edit')) {
        replyText += `### 🎒 How to Edit Your Profile & Details:\n1. Click on your name at the **bottom of the left sidebar**.\n2. In the popup, click the **Details** button.\n3. Fill in any details you like (Name, Age, Phone, Address, College, Major, Graduation, Bio). All fields are optional!\n4. Click **Save Details** to sync it with the database!`;
      } else if (lowerMsg.includes('exam') || lowerMsg.includes('attempt') || lowerMsg.includes('start') || lowerMsg.includes('limit')) {
        replyText += `### 📝 How to Attempt Exams:\n1. Click **Available Exams** in the sidebar.\n2. If you don't see any, enter your teacher's code (try default **455770**).\n3. Click the **Start Exam** card button.\n4. Remember: the platform enforces a **strict 1-attempt limit**! Once submitted, the button will be disabled.`;
      } else if (lowerMsg.includes('teacher') || lowerMsg.includes('code') || lowerMsg.includes('unlock') || lowerMsg.includes('455770')) {
        replyText += `### 🔑 Using a Teacher Access Code:\n1. Students can type a 6-digit teacher code in the **sidebar entry box**.\n2. The system reloads the exams catalog immediately to sync with that teacher!\n3. Try default code **455770** to view Mathematics and Calculus exams!`;
      } else if (lowerMsg.includes('tutor') || lowerMsg.includes('ai') || lowerMsg.includes('chat') || lowerMsg.includes('review')) {
        replyText += `### ✨ Reviewing Exams & the AI Tutor:\n1. Go to **My Attempts** in the student sidebar.\n2. Click **Review answers** on any graded exam.\n3. The review screen features a draggable, resizable vertical split pane.\n4. The **AI Tutor** occupies the right panel and provides separate chat histories for each question!`;
      } else if (lowerMsg.includes('teacher') || lowerMsg.includes('admin') || lowerMsg.includes('analysis') || lowerMsg.includes('folder')) {
        replyText += `### 🎓 Teacher & Admin Controls:\n1. Switch roles to **Teacher** via your name menu dropdown.\n2. Go to **My Exams** to create folders and manage exams.\n3. Click any exam card to open a **full-page performance analysis** (/admin/exams/[id]/analysis) listing averages, topic success rates, proctor health warnings, and leaderboards!\n4. Go to **Students** to view aggregated classroom statistics polling every 5 seconds!`;
      } else {
        replyText += `### 🧭 Quick Navigation Manual:\n* **Are you a Student?** Go to **Available Exams** to start, and **My Attempts** to review answers and see leaderboards.\n* **Are you a Teacher?** Visit **My Exams** to create folders/exams, click them to view full-page analytics, or go to **Students** for aggregated classroom insights.\n* **To edit details:** Click your name in the bottom-left sidebar, then click **Details**!\n\nTell me what you are looking for, and I'll route you there! 🚀`;
      }
    }

    return NextResponse.json({ reply: replyText, usedGroq: false, groqModel, groqError });
  } catch (error) {
    console.error('Tourist Guide API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
