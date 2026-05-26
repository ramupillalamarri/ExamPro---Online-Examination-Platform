import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15)

// Mock data (fallback in case database connection fails or during initial load)
const mockFolders = [
  { id: 'folder-1', name: 'Mathematics', createdBy: 'admin-1', createdAt: new Date('2024-01-15'), examCount: 3 },
  { id: 'folder-2', name: 'Physics', createdBy: 'admin-1', createdAt: new Date('2024-01-16'), examCount: 2 },
  { id: 'folder-3', name: 'Chemistry', createdBy: 'admin-1', createdAt: new Date('2024-01-17'), examCount: 1 },
]

const mockExams = [
  {
    id: 'exam-1',
    title: 'Algebra Fundamentals',
    description: 'Test your knowledge of basic algebraic concepts including equations, inequalities, and functions.',
    durationMinutes: 45,
    folderId: 'folder-1',
    folderName: 'Mathematics',
    isPublished: true,
    negativeMarking: 0.25,
    maxAttempts: 2,
    createdBy: 'admin-1',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    questionCount: 5,
    attemptCount: 24,
  },
  {
    id: 'exam-2',
    title: 'Calculus Basics',
    description: 'Introduction to differential and integral calculus concepts.',
    durationMinutes: 60,
    folderId: 'folder-1',
    folderName: 'Mathematics',
    isPublished: true,
    negativeMarking: 0,
    maxAttempts: 2,
    createdBy: 'admin-1',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
    questionCount: 5,
    attemptCount: 18,
  },
  {
    id: 'exam-3',
    title: 'Classical Mechanics',
    description: "Newton's laws, motion, and forces.",
    durationMinutes: 50,
    folderId: 'folder-2',
    folderName: 'Physics',
    isPublished: true,
    negativeMarking: 0.25,
    maxAttempts: 2,
    createdBy: 'admin-1',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    questionCount: 5,
    attemptCount: 15,
  },
  {
    id: 'exam-4',
    title: 'Organic Chemistry Intro',
    description: 'Basic concepts of organic chemistry including hydrocarbons and functional groups.',
    durationMinutes: 40,
    folderId: 'folder-3',
    folderName: 'Chemistry',
    isPublished: false,
    negativeMarking: 0,
    maxAttempts: 2,
    createdBy: 'admin-1',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    questionCount: 3,
    attemptCount: 0,
  },
]

const mockQuestions = [
  {
    id: 'q-1',
    examId: 'exam-1',
    questionText: 'Solve for x: 2x + 5 = 13',
    options: [
      { id: 'a', text: 'x = 3' },
      { id: 'b', text: 'x = 4' },
      { id: 'c', text: 'x = 5' },
      { id: 'd', text: 'x = 6' },
    ],
    correctOptionId: 'b',
    subject: 'Mathematics',
    topic: 'Linear Equations',
    marks: 2,
    orderIndex: 0,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'q-2',
    examId: 'exam-1',
    questionText: 'Which of the following is a quadratic equation?',
    options: [
      { id: 'a', text: '2x + 3 = 0' },
      { id: 'b', text: 'x² + 2x + 1 = 0' },
      { id: 'c', text: '3x = 9' },
      { id: 'd', text: 'x/2 = 4' },
    ],
    correctOptionId: 'b',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    marks: 2,
    orderIndex: 1,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'q-3',
    examId: 'exam-1',
    questionText: 'If f(x) = 3x - 2, what is f(4)?',
    options: [
      { id: 'a', text: '8' },
      { id: 'b', text: '10' },
      { id: 'c', text: '12' },
      { id: 'd', text: '14' },
    ],
    correctOptionId: 'b',
    subject: 'Mathematics',
    topic: 'Functions',
    marks: 2,
    orderIndex: 2,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'q-4',
    examId: 'exam-1',
    questionText: 'Simplify: (x + 2)(x - 2)',
    options: [
      { id: 'a', text: 'x² - 4' },
      { id: 'b', text: 'x² + 4' },
      { id: 'c', text: 'x² - 2x + 4' },
      { id: 'd', text: '2x' },
    ],
    correctOptionId: 'a',
    subject: 'Mathematics',
    topic: 'Algebraic Expressions',
    marks: 2,
    orderIndex: 3,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'q-5',
    examId: 'exam-1',
    questionText: 'Solve the inequality: 3x - 6 > 9',
    options: [
      { id: 'a', text: 'x > 3' },
      { id: 'b', text: 'x > 5' },
      { id: 'c', text: 'x < 5' },
      { id: 'd', text: 'x > 1' },
    ],
    correctOptionId: 'b',
    subject: 'Mathematics',
    topic: 'Inequalities',
    marks: 2,
    orderIndex: 4,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'q-6',
    examId: 'exam-2',
    questionText: 'What is the derivative of f(x) = x²?',
    options: [
      { id: 'a', text: 'x' },
      { id: 'b', text: '2x' },
      { id: 'c', text: 'x²' },
      { id: 'd', text: '2' },
    ],
    correctOptionId: 'b',
    subject: 'Mathematics',
    topic: 'Derivatives',
    marks: 2,
    orderIndex: 0,
    createdAt: new Date('2024-02-05'),
  },
  {
    id: 'q-7',
    examId: 'exam-2',
    questionText: 'What is the integral of 2x dx?',
    options: [
      { id: 'a', text: 'x² + C' },
      { id: 'b', text: '2x² + C' },
      { id: 'c', text: 'x + C' },
      { id: 'd', text: '2 + C' },
    ],
    correctOptionId: 'a',
    subject: 'Mathematics',
    topic: 'Integrals',
    marks: 2,
    orderIndex: 1,
    createdAt: new Date('2024-02-05'),
  },
  {
    id: 'q-8',
    examId: 'exam-2',
    questionText: 'What is lim(x→0) sin(x)/x?',
    options: [
      { id: 'a', text: '0' },
      { id: 'b', text: '1' },
      { id: 'c', text: 'undefined' },
      { id: 'd', text: 'infinity' },
    ],
    correctOptionId: 'b',
    subject: 'Mathematics',
    topic: 'Limits',
    marks: 2,
    orderIndex: 2,
    createdAt: new Date('2024-02-05'),
  },
  {
    id: 'q-9',
    examId: 'exam-2',
    questionText: 'The derivative of e^x is:',
    options: [
      { id: 'a', text: 'xe^(x-1)' },
      { id: 'b', text: 'e^x' },
      { id: 'c', text: 'e^(x+1)' },
      { id: 'd', text: '1/e^x' },
    ],
    correctOptionId: 'b',
    subject: 'Mathematics',
    topic: 'Derivatives',
    marks: 2,
    orderIndex: 3,
    createdAt: new Date('2024-02-05'),
  },
  {
    id: 'q-10',
    examId: 'exam-2',
    questionText: 'What is the derivative of ln(x)?',
    options: [
      { id: 'a', text: '1/x' },
      { id: 'b', text: 'x' },
      { id: 'c', text: 'ln(x)/x' },
      { id: 'd', text: 'e^x' },
    ],
    correctOptionId: 'a',
    subject: 'Mathematics',
    topic: 'Derivatives',
    marks: 2,
    orderIndex: 4,
    createdAt: new Date('2024-02-05'),
  },
  {
    id: 'q-11',
    examId: 'exam-3',
    questionText: "Newton's First Law is also known as:",
    options: [
      { id: 'a', text: 'Law of Action' },
      { id: 'b', text: 'Law of Inertia' },
      { id: 'c', text: 'Law of Action-Reaction' },
      { id: 'd', text: 'Law of Gravity' },
    ],
    correctOptionId: 'b',
    subject: 'Physics',
    topic: "Newton's Laws",
    marks: 2,
    orderIndex: 0,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 'q-12',
    examId: 'exam-3',
    questionText: 'The SI unit of force is:',
    options: [
      { id: 'a', text: 'Joule' },
      { id: 'b', text: 'Watt' },
      { id: 'c', text: 'Newton' },
      { id: 'd', text: 'Pascal' },
    ],
    correctOptionId: 'c',
    subject: 'Physics',
    topic: 'Force',
    marks: 2,
    orderIndex: 1,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 'q-13',
    examId: 'exam-3',
    questionText: 'What is the formula for momentum?',
    options: [
      { id: 'a', text: 'p = m/v' },
      { id: 'b', text: 'p = mv' },
      { id: 'c', text: 'p = m + v' },
      { id: 'd', text: 'p = v/m' },
    ],
    correctOptionId: 'b',
    subject: 'Physics',
    topic: 'Momentum',
    marks: 2,
    orderIndex: 2,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 'q-14',
    examId: 'exam-3',
    questionText: 'Acceleration due to gravity on Earth is approximately:',
    options: [
      { id: 'a', text: '8.9 m/s²' },
      { id: 'b', text: '9.8 m/s²' },
      { id: 'c', text: '10.8 m/s²' },
      { id: 'd', text: '11.8 m/s²' },
    ],
    correctOptionId: 'b',
    subject: 'Physics',
    topic: 'Gravity',
    marks: 2,
    orderIndex: 3,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 'q-15',
    examId: 'exam-3',
    questionText: 'Work is calculated as:',
    options: [
      { id: 'a', text: 'Force + Distance' },
      { id: 'b', text: 'Force - Distance' },
      { id: 'c', text: 'Force × Distance' },
      { id: 'd', text: 'Force / Distance' },
    ],
    correctOptionId: 'c',
    subject: 'Physics',
    topic: 'Work and Energy',
    marks: 2,
    orderIndex: 4,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 'q-16',
    examId: 'exam-4',
    questionText: 'What is the simplest hydrocarbon?',
    options: [
      { id: 'a', text: 'Ethane' },
      { id: 'b', text: 'Methane' },
      { id: 'c', text: 'Propane' },
      { id: 'd', text: 'Butane' },
    ],
    correctOptionId: 'b',
    subject: 'Chemistry',
    topic: 'Hydrocarbons',
    marks: 2,
    orderIndex: 0,
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'q-17',
    examId: 'exam-4',
    questionText: 'The functional group -OH is called:',
    options: [
      { id: 'a', text: 'Aldehyde' },
      { id: 'b', text: 'Ketone' },
      { id: 'c', text: 'Hydroxyl' },
      { id: 'd', text: 'Carboxyl' },
    ],
    correctOptionId: 'c',
    subject: 'Chemistry',
    topic: 'Functional Groups',
    marks: 2,
    orderIndex: 1,
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'q-18',
    examId: 'exam-4',
    questionText: 'Organic compounds primarily contain which element?',
    options: [
      { id: 'a', text: 'Oxygen' },
      { id: 'b', text: 'Nitrogen' },
      { id: 'c', text: 'Carbon' },
      { id: 'd', text: 'Hydrogen' },
    ],
    correctOptionId: 'c',
    subject: 'Chemistry',
    topic: 'Organic Chemistry Basics',
    marks: 2,
    orderIndex: 2,
    createdAt: new Date('2024-02-15'),
  },
]

const mockAttempts = [
  {
    id: 'attempt-1',
    examId: 'exam-1',
    examTitle: 'Algebra Fundamentals',
    userId: 'student-1',
    status: 'graded',
    startedAt: new Date('2024-03-01T10:00:00'),
    submittedAt: new Date('2024-03-01T10:35:00'),
    score: 8,
    totalMarks: 10,
    rank: 3,
    warnings: 0,
    createdAt: new Date('2024-03-01T10:00:00'),
  },
  {
    id: 'attempt-2',
    examId: 'exam-2',
    examTitle: 'Calculus Basics',
    userId: 'student-1',
    status: 'graded',
    startedAt: new Date('2024-03-05T14:00:00'),
    submittedAt: new Date('2024-03-05T14:50:00'),
    score: 6,
    totalMarks: 10,
    rank: 8,
    warnings: 1,
    createdAt: new Date('2024-03-05T14:00:00'),
  },
]

const mockAnswers = [
  { id: 'ans-1', attemptId: 'attempt-1', questionId: 'q-1', selectedOptionId: 'b', isCorrect: true, updatedAt: new Date() },
  { id: 'ans-2', attemptId: 'attempt-1', questionId: 'q-2', selectedOptionId: 'b', isCorrect: true, updatedAt: new Date() },
  { id: 'ans-3', attemptId: 'attempt-1', questionId: 'q-3', selectedOptionId: 'b', isCorrect: true, updatedAt: new Date() },
  { id: 'ans-4', attemptId: 'attempt-1', questionId: 'q-4', selectedOptionId: 'a', isCorrect: true, updatedAt: new Date() },
  { id: 'ans-5', attemptId: 'attempt-1', questionId: 'q-5', selectedOptionId: 'a', isCorrect: false, updatedAt: new Date() },
  { id: 'ans-6', attemptId: 'attempt-2', questionId: 'q-6', selectedOptionId: 'b', isCorrect: true, updatedAt: new Date() },
  { id: 'ans-7', attemptId: 'attempt-2', questionId: 'q-7', selectedOptionId: 'b', isCorrect: false, updatedAt: new Date() },
  { id: 'ans-8', attemptId: 'attempt-2', questionId: 'q-8', selectedOptionId: 'b', isCorrect: true, updatedAt: new Date() },
  { id: 'ans-9', attemptId: 'attempt-2', questionId: 'q-9', selectedOptionId: 'b', isCorrect: true, updatedAt: new Date() },
  { id: 'ans-10', attemptId: 'attempt-2', questionId: 'q-10', selectedOptionId: 'b', isCorrect: false, updatedAt: new Date() },
]


export const useExamStore = create()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      currentUserCode: '123456', // Default to ramupillalamarri66@gmail.com user code
      accessedUsers: [], // Users whose codes this user has entered
      folders: mockFolders,
      exams: mockExams,
      questions: mockQuestions,
      attempts: mockAttempts,
      answers: mockAnswers,
      aiFeedback: [],
      
      // Sync all data from PostgreSQL
      fetchData: async () => {
        try {
          const user = get().user;
          const url = user ? `/api/data?userId=${user.id}` : '/api/data';
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            set({
              folders: data.folders || [],
              exams: data.exams || [],
              questions: data.questions || [],
              attempts: data.attempts || [],
              answers: data.answers || [],
              aiFeedback: data.aiFeedback || [],
            });
            console.log('Successfully synced data with PostgreSQL!');
          }
        } catch (err) {
          console.error('Failed to sync data with PostgreSQL, using offline cache:', err);
        }
      },

      // Auth actions
      login: async (email, role, fullName, avatarUrl) => {
        try {
          // Initialize DB first to guarantee database online
          await fetch('/api/init', { method: 'POST' }).catch(() => {});

          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role, fullName, avatarUrl }),
          });
          
          if (res.ok) {
            const user = await res.json();
            set({ user, isAuthenticated: true, isHydrated: true });
            // Set current code to user's own code
            if (user.userCode) {
              set({ currentUserCode: user.userCode })
            }
            // Load fresh data for this user
            await get().fetchData();
          } else {
            throw new Error('Server auth failed');
          }
        } catch (err) {
          console.error('Auth error, falling back to mock login:', err);
          const userCode = Math.floor(100000 + Math.random() * 900000).toString();
          const user = {
            id: role === 'admin' ? 'admin-1' : 'student-1',
            email,
            fullName: fullName || email.split('@')[0],
            role,
            userCode,
            createdAt: new Date(),
          };
          set({ user, isAuthenticated: true, isHydrated: true, currentUserCode: userCode });
        }
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      
      // Folder actions
      addFolder: async (name) => {
        const id = generateId();
        const folder = {
          id,
          name,
          createdBy: get().user?.id || 'admin-1',
          createdAt: new Date(),
          examCount: 0,
        };
        
        // Optimistic state update
        set((state) => ({ folders: [folder, ...state.folders] }));
        
        // Background API synchronization
        fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(folder),
        }).then(async (res) => {
          if (res.ok) {
            const serverFolder = await res.json();
            set((state) => ({
              folders: state.folders.map(f => f.id === id ? serverFolder : f)
            }));
          }
        }).catch(err => console.error('Folder sync failed:', err));

        return folder;
      },
      
      updateFolder: async (id, name) => {
        // Optimistic update
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        }));
        
        fetch('/api/folders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, name }),
        }).catch(err => console.error('Folder update failed:', err));
      },
      
      deleteFolder: async (id) => {
        // Optimistic update
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          exams: state.exams.map((e) => (e.folderId === id ? { ...e, folderId: undefined, folderName: undefined } : e)),
        }));
        
        fetch(`/api/folders?id=${id}`, {
          method: 'DELETE',
        }).catch(err => console.error('Folder deletion failed:', err));
      },
      
      // Exam actions
      addExam: async (examData) => {
        const id = generateId();
        const folder = get().folders.find((f) => f.id === examData.folderId);
        const exam = {
          ...examData,
          id,
          folderName: folder?.name,
          maxAttempts: examData.maxAttempts || 2,
          createdBy: get().user?.id || 'admin-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          questionCount: 0,
          attemptCount: 0,
        };
        
        // Optimistic update
        set((state) => ({ exams: [exam, ...state.exams] }));
        
        fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exam),
        }).then(async (res) => {
          if (res.ok) {
            const serverExam = await res.json();
            set((state) => ({
              exams: state.exams.map(e => e.id === id ? serverExam : e)
            }));
          }
        }).catch(err => console.error('Exam sync failed:', err));

        return exam;
      },
      
      updateExam: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          exams: state.exams.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e),
        }));
        
        fetch('/api/exams', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates }),
        }).catch(err => console.error('Exam update failed:', err));
      },
      
      deleteExam: async (id) => {
        // Optimistic update
        set((state) => ({
          exams: state.exams.filter((e) => e.id !== id),
          questions: state.questions.filter((q) => q.examId !== id),
        }));
        
        fetch(`/api/exams?id=${id}`, {
          method: 'DELETE',
        }).catch(err => console.error('Exam deletion failed:', err));
      },
      
      publishExam: async (id, publish) => {
        await get().updateExam(id, { isPublished: publish });
      },
      
      // Question actions
      addQuestion: async (questionData) => {
        const id = generateId();
        const question = {
          ...questionData,
          id,
          createdAt: new Date(),
        };
        
        // Optimistic update
        set((state) => {
          const updatedExams = state.exams.map((e) =>
            e.id === questionData.examId
              ? { ...e, questionCount: (e.questionCount || 0) + 1 } : e)
          return {
            questions: [...state.questions, question],
            exams: updatedExams,
          }
        });
        
        fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(question),
        }).then(async (res) => {
          if (res.ok) {
            const serverQuestion = await res.json();
            set((state) => ({
              questions: state.questions.map(q => q.id === id ? serverQuestion : q)
            }));
          }
        }).catch(err => console.error('Question sync failed:', err));

        return question;
      },
      
      updateQuestion: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          questions: state.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        }));
        
        fetch('/api/questions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates }),
        }).catch(err => console.error('Question update failed:', err));
      },
      
      deleteQuestion: async (id) => {
        const question = get().questions.find((q) => q.id === id);
        
        // Optimistic update
        set((state) => {
          const updatedExams = state.exams.map((e) =>
            e.id === question?.examId
              ? { ...e, questionCount: Math.max(0, (e.questionCount || 0) - 1) } : e)
          return {
            questions: state.questions.filter((q) => q.id !== id),
            exams: updatedExams,
          }
        });
        
        fetch(`/api/questions?id=${id}`, {
          method: 'DELETE',
        }).catch(err => console.error('Question deletion failed:', err));
      },
      
      getExamQuestions: (examId) => {
        return get().questions.filter((q) => q.examId === examId).sort((a, b) => a.orderIndex - b.orderIndex)
      },

      getAttemptStats: (examId, userId) => {
        const attempts = get().attempts.filter(
          (a) => a.examId === examId && a.userId === userId
        )
        const completed = attempts.filter((a) => a.status === 'graded')
        const inProgress = attempts.filter((a) => a.status === 'in_progress')
        const exam = get().exams.find((e) => e.id === examId)
        const maxAttempts = exam?.maxAttempts || 2

        return {
          total: attempts.length,
          completed: completed.length,
          inProgress: inProgress.length,
          remaining: Math.max(0, maxAttempts - completed.length),
          maxAllowed: maxAttempts,
          canAttempt: completed.length < maxAttempts,
          bestScore: completed.length > 0 ? Math.max(...completed.map((a) => a.score || 0)) : null,
        }
      },
      
      // Attempt actions
      startAttempt: (examId) => {
        const exam = get().exams.find((e) => e.id === examId)
        const userId = get().user?.id || 'student-1'
        const maxAttempts = exam?.maxAttempts || 2
        
        // Check for existing in-progress attempt
        const existingAttempt = get().attempts.find(
          (a) => a.examId === examId && a.userId === userId && a.status === 'in_progress'
        )
        
        if (existingAttempt) {
          return existingAttempt
        }
        
        // Check if student has exhausted attempts
        const completedAttempts = get().attempts.filter(
          (a) => a.examId === examId && a.userId === userId && a.status === 'graded'
        )
        
        if (completedAttempts.length >= maxAttempts) {
          throw new Error(`Maximum ${maxAttempts} attempts allowed for this exam. You have already used all your attempts.`)
        }
        
        const id = generateId()
        const attempt = {
          id,
          examId,
          examTitle: exam?.title,
          userId,
          status: 'in_progress',
          startedAt: new Date(),
          timeRemainingSeconds: (exam?.durationMinutes || 60) * 60,
          warnings: 0,
          createdAt: new Date(),
        }
        
        // Optimistic update
        set((state) => ({
          attempts: [...state.attempts, attempt],
          exams: state.exams.map((e) =>
            e.id === examId ? { ...e, attemptCount: (e.attemptCount || 0) + 1 } : e),
        }));
        
        fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, examId, userId }),
        }).catch(err => console.error('Attempt start sync failed:', err));
        
        return attempt
      },
      
      submitAttempt: async (attemptId) => {
        // Optimistic local evaluation first so UI responds immediately
        const attempt = get().attempts.find((a) => a.id === attemptId)
        if (!attempt) return
        
        const questions = get().getExamQuestions(attempt.examId)
        const attemptAnswers = get().getAttemptAnswers(attemptId)
        const exam = get().exams.find((e) => e.id === attempt.examId)
        
        let score = 0
        const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
        
        attemptAnswers.forEach((answer) => {
          const question = questions.find((q) => q.id === answer.questionId)
          if (!question) return
          
          const isCorrect = answer.selectedOptionId === question.correctOptionId
          if (isCorrect) {
            score += question.marks
          } else if (answer.selectedOptionId && exam?.negativeMarking) {
            score -= question.marks * exam.negativeMarking
          }
        })
        
        score = Math.max(0, score)
        const rank = Math.min(20, Math.ceil((1 - score / (totalMarks || 1)) * 20) + 1)
        
        set((state) => ({
          attempts: state.attempts.map((a) =>
            a.id === attemptId
              ? {
                  ...a,
                  status: 'graded',
                  submittedAt: new Date(),
                  score,
                  totalMarks,
                  rank,
                } : a),
          answers: state.answers.map((ans) => {
            if (ans.attemptId !== attemptId) return ans
            const question = questions.find((q) => q.id === ans.questionId)
            return {
              ...ans,
              isCorrect: ans.selectedOptionId === question?.correctOptionId,
            }
          }),
        }));
        
        // evaluation and syncing on DB side
        try {
          const res = await fetch('/api/attempts/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attemptId }),
          });

          if (res.ok) {
            const data = await res.json();
            // Sync returned AI Feedback and graded attempt
            set((state) => ({
              attempts: state.attempts.map(a => a.id === attemptId ? data.attempt : a),
              aiFeedback: [...state.aiFeedback.filter(f => f.attemptId !== attemptId), data.feedback]
            }));
          }
        } catch (err) {
          console.error('Failed to grade attempt on database, falling back to local feedback:', err);
          await get().generateFeedback(attemptId);
        }
      },
      
      updateAttemptWarnings: async (attemptId) => {
        // Optimistic update
        set((state) => ({
          attempts: state.attempts.map((a) =>
            a.id === attemptId ? { ...a, warnings: a.warnings + 1 } : a),
        }));
        
        fetch('/api/attempts/warning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId }),
        }).catch(err => console.error('Attempt warning sync failed:', err));
      },
      
      getCurrentAttempt: (examId) => {
        return get().attempts.find(
          (a) => a.examId === examId && a.userId === get().user?.id && a.status === 'in_progress'
        )
      },
      
      // Answer actions
      saveAnswer: async (attemptId, questionId, optionId) => {
        const id = generateId()
        const existingAnswer = get().answers.find(
          (a) => a.attemptId === attemptId && a.questionId === questionId
        )
        
        if (existingAnswer) {
          set((state) => ({
            answers: state.answers.map((a) =>
              a.id === existingAnswer.id
                ? { ...a, selectedOptionId: optionId, updatedAt: new Date() } : a),
          }))
        } else {
          const answer = {
            id,
            attemptId,
            questionId,
            selectedOptionId: optionId,
            updatedAt: new Date(),
          }
          set((state) => ({ answers: [...state.answers, answer] }))
        }

        fetch('/api/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: existingAnswer?.id || id,
            attemptId,
            questionId,
            selectedOptionId: optionId
          }),
        }).catch(err => console.error('Answer saving failed:', err));
      },
      
      getAttemptAnswers: (attemptId) => {
        return get().answers.filter((a) => a.attemptId === attemptId)
      },
      
      // AI Feedback (offline fallback generation)
      generateFeedback: async (attemptId) => {
        const attempt = get().attempts.find((a) => a.id === attemptId)
        if (!attempt) return {}
        
        const questions = get().getExamQuestions(attempt.examId)
        const attemptAnswers = get().getAttemptAnswers(attemptId)
        
        const wrongAnswers = attemptAnswers.filter((ans) => {
          const question = questions.find((q) => q.id === ans.questionId)
          return ans.selectedOptionId && ans.selectedOptionId !== question?.correctOptionId
        })
        
        const mistakeAnalysis = wrongAnswers.map((ans) => {
          const question = questions.find((q) => q.id === ans.questionId)
          const selectedOption = question.options.find((o) => o.id === ans.selectedOptionId)
          const correctOption = question.options.find((o) => o.id === question.correctOptionId)
          
          return {
            questionId: ans.questionId,
            explanation: `You selected "${selectedOption?.text}" but the correct answer is "${correctOption?.text}". ${
              question.topic ? `This question tests your understanding of ${question.topic}.` : ''
            } Review the concept and practice similar problems.`,
          }
        })
        
        const topicCounts = {}
        wrongAnswers.forEach((ans) => {
          const question = questions.find((q) => q.id === ans.questionId)
          const topic = question?.topic || 'General'
          const subject = question?.subject || 'General'
          if (!topicCounts[topic]) {
            topicCounts[topic] = { subject, count: 0 }
          }
          topicCounts[topic].count++
        })
        
        const weakTopics = Object.entries(topicCounts).map(([topic, data]) => ({
          topic,
          subject: data.subject,
          questionCount: data.count,
          recommendation: `Focus on practicing more ${topic} problems to strengthen your understanding.`,
        }))
        
        const feedback = {
          id: generateId(),
          attemptId,
          mistakeAnalysis,
          weakTopics,
          createdAt: new Date(),
        }
        
        set((state) => ({ aiFeedback: [...state.aiFeedback, feedback] }))
        return feedback
      },
      
      setExams: (exams) => {
        set({ exams })
      },
      
      setQuestions: (questions) => {
        set({ questions })
      },

      // User Code Management Actions
      generateUserCode: () => {
        // Generate random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        return code
      },

      setCurrentUserCode: (code) => {
        set({ currentUserCode: code })
        // Fetch exams for this user code
        get().fetchExamsByUserCode(code)
      },

      enterUserCode: async (code) => {
        try {
          const res = await fetch('/api/user-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: get().user?.id,
              userCode: code,
            }),
          })
          
          if (res.ok) {
            const data = await res.json()
            // Add to accessed users and switch context
            set((state) => ({
              accessedUsers: [...state.accessedUsers, data.accessedUser],
              currentUserCode: code,
            }))
            // Fetch exams for this code
            await get().fetchExamsByUserCode(code)
            return { success: true, message: 'Successfully joined!' }
          } else {
            const error = await res.json()
            return { success: false, message: error.message || 'Invalid code' }
          }
        } catch (err) {
          console.error('Error entering user code:', err)
          return { success: false, message: 'Failed to join. Please try again.' }
        }
      },

      fetchExamsByUserCode: async (code) => {
        try {
          const res = await fetch(`/api/exams?userCode=${code}`)
          if (res.ok) {
            const data = await res.json()
            set({ exams: data.exams || [] })
          }
        } catch (err) {
          console.error('Failed to fetch exams by user code:', err)
        }
      },

      getAccessedByUsers: async () => {
        try {
          const res = await fetch(`/api/students?userId=${get().user?.id}`)
          if (res.ok) {
            const data = await res.json()
            return data.students || []
          }
        } catch (err) {
          console.error('Failed to fetch accessed by users:', err)
          return []
        }
      },
    }),
    {
      name: 'exam-platform-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentUserCode: state.currentUserCode,
        accessedUsers: state.accessedUsers,
        folders: state.folders,
        exams: state.exams,
        questions: state.questions,
        attempts: state.attempts,
        answers: state.answers,
        aiFeedback: state.aiFeedback,
      }),
    }
  )
)
