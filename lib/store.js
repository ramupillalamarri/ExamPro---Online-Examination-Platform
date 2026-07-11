import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15)
export const useExamStore = create()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      currentRole: null, // 'student' or 'teacher'
      currentUserCode: null,
      activeTeacher: null,
      accessedUsers: [], // Users whose codes this user has entered
      folders: [],
      exams: [],
      questions: [],
      attempts: [],
      answers: [],
      aiFeedback: [],
      
      fetchData: async (examId = null) => {
        try {
          if (!get().isHydrated) {
            console.log('fetchData: Store not hydrated yet. Skipping fetch.');
            return;
          }
          const user = get().user;
          const userCode = get().currentUserCode || (user?.role === 'student' ? '455770' : null);
          let url = '/api/data';
          if (user) {
            url = `/api/data?userId=${user.id}`;
            if (user.role === 'student' && userCode) {
              url += `&userCode=${userCode}`;
            }
            if (examId) {
              url += `&examId=${examId}`;
            }
          }
          const res = await fetch(url, { cache: 'no-store' });
          
          if (!res.ok) {
            throw new Error(`API returned ${res.status}: ${res.statusText}`);
          }
          
          const data = await res.json();
          if (data.userExists === false) {
            console.warn('User session not found in database. Logging out...');
            get().logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return null;
          }
          set({
            folders: (data.folders || []).map(f => ({ ...f, parentId: f.parent_id || f.parentId })),
            exams: data.exams || [],
            questions: data.questions || [],
            attempts: data.attempts || [],
            answers: data.answers || [],
            aiFeedback: data.aiFeedback || [],
            activeTeacher: data.activeTeacher || null,
          });
          console.log('Successfully synced data with PostgreSQL!');
          return data;
        } catch (err) {
          console.error('Failed to sync data with PostgreSQL, using offline cache:', err.message);
          // Don't throw - allow offline mode with mock data
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
            // Set current code to user's own code or default to 455770 for students
            if (user.role === 'student') {
              set({ currentUserCode: '455770' })
            } else if (user.userCode) {
              set({ currentUserCode: user.userCode })
            }
            // Load fresh data for this user
            await get().fetchData();
          } else {
            throw new Error('Server auth failed');
          }
        } catch (err) {
          console.error('Auth error, falling back to mock login:', err);
          // If we have a persisted code, reuse it. Do NOT generate a new user code offline
          // to avoid collisions across browsers/devices. If no persisted code exists,
          // leave userCode null and require online login to obtain a stable code.
          const existingCode = get().currentUserCode || null;
          const user = {
            id: role === 'admin' ? 'admin-1' : 'student-1',
            email,
            fullName: fullName || email.split('@')[0],
            role,
            userCode: existingCode || (role === 'student' ? '455770' : null),
            createdAt: new Date(),
          };
          const toSet = { user, isAuthenticated: true, isHydrated: true };
          if (role === 'student') {
            toSet.currentUserCode = '455770';
          } else if (existingCode) {
            toSet.currentUserCode = existingCode;
          }
          set(toSet);
        }
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false, currentRole: null });
      },

      setCurrentRole: async (role) => {
        const user = get().user;
        const targetCode = role === 'student' ? '455770' : (user?.userCode || null);
        set({ currentRole: role, currentUserCode: targetCode });
        
        if (user) {
          try {
            const res = await fetch('/api/user/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, role }),
            });
            if (res.ok) {
              const updatedUser = await res.json();
              set({ user: updatedUser });
            }
          } catch (err) {
            console.error('Failed to sync role to database:', err);
          }
        }
        
        await get().fetchData();
      },

      updateUserProfile: async (profileData) => {
        try {
          const res = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: get().user?.id, ...profileData }),
          });
          if (res.ok) {
            const updatedUser = await res.json();
            set({ user: updatedUser });
            return updatedUser;
          } else {
            const err = await res.json();
            throw new Error(err.error || 'Failed to update profile');
          }
        } catch (error) {
          console.error('Update profile error, fallback to offline state:', error);
          const currentUser = get().user;
          const updatedUser = {
            ...currentUser,
            fullName: profileData.fullName !== undefined ? profileData.fullName : currentUser?.fullName,
            age: profileData.age !== undefined ? (profileData.age ? parseInt(profileData.age) : null) : currentUser?.age,
            phoneNumber: profileData.phoneNumber !== undefined ? profileData.phoneNumber : currentUser?.phoneNumber,
            address: profileData.address !== undefined ? profileData.address : currentUser?.address,
            college: profileData.college !== undefined ? profileData.college : currentUser?.college,
            major: profileData.major !== undefined ? profileData.major : currentUser?.major,
            graduationYear: profileData.graduationYear !== undefined ? (profileData.graduationYear ? parseInt(profileData.graduationYear) : null) : currentUser?.graduationYear,
            bio: profileData.bio !== undefined ? profileData.bio : currentUser?.bio,
            avatarUrl: profileData.avatarUrl !== undefined ? profileData.avatarUrl : currentUser?.avatarUrl,
          };
          set({ user: updatedUser });
          return updatedUser;
        }
      },
      
      // Folder actions
      addFolder: async (name, parentId = null) => {
        const id = generateId();
        const folder = {
          id,
          name,
          parentId,
          createdBy: get().user?.id || 'admin-1',
          createdAt: new Date(),
          examCount: 0,
        };
        
        // Optimistic state update
        set((state) => ({ folders: [folder, ...state.folders] }));
        
        // Background API synchronization
        try {
          const res = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              name,
              createdBy: get().user?.id || 'admin-1',
              parentId
            }),
          });
          
          if (res.ok) {
            const serverFolder = await res.json();
            const clientFolder = {
              ...serverFolder,
              parentId: serverFolder.parent_id || serverFolder.parentId
            };
            set((state) => ({
              folders: state.folders.map(f => f.id === id ? clientFolder : f)
            }));
          } else {
            throw new Error(`Server error: ${res.statusText}`);
          }
        } catch (err) {
          console.error('Folder sync failed:', err);
          // Remove optimistic update on error
          set((state) => ({ folders: state.folders.filter(f => f.id !== id) }));
        }

        return folder;
      },
      
      updateFolder: async (id, name) => {
        const originalFolder = get().folders.find(f => f.id === id);
        
        // Optimistic update
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        }));
        
        try {
          const res = await fetch('/api/folders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, userId: get().user?.id }),
          });
          
          if (!res.ok) {
            throw new Error(`Server error: ${res.statusText}`);
          }
        } catch (err) {
          console.error('Folder update failed:', err);
          // Revert optimistic update on error
          if (originalFolder) {
            set((state) => ({
              folders: state.folders.map((f) => (f.id === id ? originalFolder : f)),
            }));
          }
        }
      },
      
      deleteFolder: async (id, deleteExamsOption = false) => {
        const folders = get().folders;
        const backupFolders = get().folders;
        const backupExams = get().exams;
        
        // Helper to get recursive subfolders
        const getSubfolderIds = (folderList, folderId) => {
          const ids = [folderId];
          const findChildren = (pid) => {
            folderList.forEach(f => {
              if (f.parentId === pid) {
                ids.push(f.id);
                findChildren(f.id);
              }
            });
          };
          findChildren(folderId);
          return ids;
        };
        
        const idsToDelete = getSubfolderIds(folders, id);
        
        // Optimistic update
        set((state) => {
          const updatedFolders = state.folders.filter((f) => !idsToDelete.includes(f.id));
          const updatedExams = deleteExamsOption
            ? state.exams.filter((e) => !idsToDelete.includes(e.folderId))
            : state.exams.map((e) => (idsToDelete.includes(e.folderId) ? { ...e, folderId: undefined, folderName: undefined } : e));
            
          return {
            folders: updatedFolders,
            exams: updatedExams
          };
        });
        
        try {
          const res = await fetch(`/api/folders?id=${id}&userId=${get().user?.id}&deleteExams=${deleteExamsOption}`, {
            method: 'DELETE',
          });
          
          if (!res.ok) {
            throw new Error(`Server error: ${res.statusText}`);
          }
        } catch (err) {
          console.error('Folder deletion failed:', err);
          // Revert optimistic update on error
          set(() => ({
            folders: backupFolders,
            exams: backupExams,
          }));
        }
      },
      
      // Exam actions
      addExam: (examData) => {
        const id = generateId();
        const folder = get().folders.find((f) => f.id === examData.folderId);
        const exam = {
          ...examData,
          id,
          folderName: folder?.name,
          maxAttempts: examData.maxAttempts || 1,
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
          body: JSON.stringify({ id, userId: get().user?.id, ...updates }),
        }).catch(err => console.error('Exam update failed:', err));
      },
      
      deleteExam: async (id) => {
        // Optimistic update
        set((state) => ({
          exams: state.exams.filter((e) => e.id !== id),
          questions: state.questions.filter((q) => q.examId !== id),
        }));
        
        fetch(`/api/exams?id=${id}&userId=${get().user?.id}`, {
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
          body: JSON.stringify({ ...question, userId: get().user?.id }),
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
          body: JSON.stringify({ id, userId: get().user?.id, ...updates }),
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
        
        fetch(`/api/questions?id=${id}&userId=${get().user?.id}`, {
          method: 'DELETE',
        }).catch(err => console.error('Question deletion failed:', err));
      },
      
      getExamQuestions: (examId) => {
        return (get().questions || []).filter((q) => q.examId === examId).sort((a, b) => a.orderIndex - b.orderIndex)
      },

      getAttemptStats: (examId, userId) => {
        const attempts = (get().attempts || []).filter(
          (a) => a.examId === examId && a.userId === userId
        )
        const completed = attempts.filter((a) => a.status === 'graded')
        const inProgress = attempts.filter((a) => a.status === 'in_progress')
        const exam = (get().exams || []).find((e) => e.id === examId)
        const maxAttempts = exam?.maxAttempts || 1

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
      startAttempt: async (examId) => {
        const exam = (get().exams || []).find((e) => e.id === examId)
        const userId = get().user?.id || 'student-1'
        const maxAttempts = exam?.maxAttempts || 1
        
        // Check for existing in-progress attempt
        const existingAttempt = (get().attempts || []).find(
          (a) => a.examId === examId && a.userId === userId && a.status === 'in_progress'
        )
        
        if (existingAttempt) {
          return existingAttempt
        }
        
        // Check if student has exhausted attempts
        const completedAttempts = (get().attempts || []).filter(
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
        
        try {
          const response = await fetch('/api/attempts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, examId, userId }),
          })
          
          if (!response.ok) {
            throw new Error(`Failed to start attempt: ${response.statusText}`)
          }
          
          const serverAttempt = await response.json()
          
          // Update with server response
          set((state) => ({
            attempts: state.attempts.map((a) =>
              a.id === id ? { ...a, ...serverAttempt } : a
            )
          }))
          
          return serverAttempt
        } catch (err) {
          // Remove optimistic update on error
          set((state) => ({
            attempts: state.attempts.filter((a) => a.id !== id),
            exams: state.exams.map((e) =>
              e.id === examId ? { ...e, attemptCount: (e.attemptCount || 1) - 1 } : e)
          }))
          throw err
        }
      },
      
      submitAttempt: async (attemptId) => {
        // Optimistic local evaluation first so UI responds immediately
        const attempt = get().attempts.find((a) => a.id === attemptId)
        if (!attempt) {
          throw new Error('Attempt not found')
        }
        
        const questions = get().getExamQuestions(attempt.examId)
        const attemptAnswers = get().getAttemptAnswers(attemptId)
        const exam = get().exams.find((e) => e.id === attempt.examId)
        
        const normalizeOptionId = (value) => {
          return typeof value === 'string' ? value.trim().toLowerCase() : ''
        }

        const normalizeOptionSet = (value) => {
          return new Set(
            (typeof value === 'string' ? value : '')
              .split(',')
              .map((item) => item.trim().toLowerCase())
              .filter(Boolean)
          )
        }

        const areMsqAnswersEqual = (correctOptionId, selectedOptionId) => {
          const correctSet = normalizeOptionSet(correctOptionId)
          const selectedSet = normalizeOptionSet(selectedOptionId)
          if (correctSet.size !== selectedSet.size) return false
          for (const optionId of correctSet) {
            if (!selectedSet.has(optionId)) return false
          }
          return true
        }

        const hasSelectedOption = (value) => normalizeOptionId(value).length > 0

        let score = 0
        const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0)
        attemptAnswers.forEach((answer) => {
          const question = questions.find((q) => q.id === answer.questionId)
          if (!question) return

          let isCorrect = false
          if (question.question_type === 'text') {
            isCorrect = null
          } else if (question.question_type === 'msq') {
            isCorrect = areMsqAnswersEqual(question.correct_option_id, answer.selected_option_id)
          } else {
            isCorrect = normalizeOptionId(answer.selected_option_id) === normalizeOptionId(question.correct_option_id)
          }

          answer.is_correct = isCorrect
          if (isCorrect === true) {
            score += (question.marks || 0)
          } else if (isCorrect === false && hasSelectedOption(answer.selected_option_id)) {
            const negMarking = question.negative_marking !== undefined && question.negative_marking !== null
              ? parseFloat(question.negative_marking)
              : (exam?.negativeMarking ? parseFloat(exam.negativeMarking) : 0)
            if (negMarking > 0) {
              score -= (question.marks || 0) * negMarking
            }
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
        
        // Sync with server for grading and feedback
        try {
          const res = await fetch('/api/attempts/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attemptId }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(errorData.error || `Server error: ${res.status}`);
          }
          
          const data = await res.json();
          // Sync returned AI Feedback and graded attempts with newly calculated ranks
          set((state) => {
            const updatedAttempts = state.attempts.map((a) => {
              const matched = data.updatedAttempts?.find((ua) => ua.id === a.id);
              return matched ? matched : a;
            });
            const finalAttempts = data.attempt ? updatedAttempts.map((a) =>
              a.id === data.attempt.id ? data.attempt : a
            ) : updatedAttempts;
            return {
              attempts: finalAttempts,
              aiFeedback: [...state.aiFeedback.filter(f => f.attemptId !== attemptId), data.feedback]
            };
          });
          // Try to refresh server state for any other pages (keeps UI in sync)
          try {
            // fire-and-forget fetchData for the exam to update attempts/exams from server
            get().fetchData && get().fetchData(data.attempt?.examId || data.updatedAttempts?.[0]?.examId);
          } catch (e) {
            console.warn('Background data sync failed after submitAttempt:', e);
          }

          return data;
        } catch (err) {
          console.error('Failed to grade attempt on database, falling back to local feedback:', err);
          try {
            await get().generateFeedback(attemptId);
          } catch (feedbackErr) {
            console.error('Also failed to generate local feedback:', feedbackErr);
            throw err;
          }
          return null;
        }
      },
      
      updateAttemptWarnings: async (attemptId) => {
        // Optimistic update
        set((state) => ({
          attempts: state.attempts.map((a) =>
            a.id === attemptId ? { ...a, warnings: (a.warnings || 0) + 1 } : a),
        }));
        
        try {
          const response = await fetch('/api/attempts/warning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attemptId }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update warnings: ${response.statusText}`);
          }
          
          const updatedAttempt = await response.json();
          if (!updatedAttempt || updatedAttempt.error) {
            throw new Error(updatedAttempt?.error || 'Invalid warning update response');
          }
          // Sync server state
          set((state) => ({
            attempts: state.attempts.map((a) =>
              a.id === attemptId ? updatedAttempt : a),
          }));
          
          return updatedAttempt;
        } catch (err) {
          console.error('Attempt warning sync failed:', err);
          // Return current attempt state as fallback
          return get().getAttemptById(attemptId);
        }
      },
      
      getCurrentAttempt: (examId) => {
        return get().attempts.find(
          (a) => a.examId === examId && a.userId === get().user?.id && a.status === 'in_progress'
        )
      },
      
      getAttemptById: (attemptId) => {
        return get().attempts.find((a) => a.id === attemptId)
      },
      
      // Answer actions
      saveAnswer: async (attemptId, questionId, optionId, descriptiveAnswer = null) => {
        const id = generateId()
        const existingAnswer = get().answers.find(
          (a) => a.attemptId === attemptId && a.questionId === questionId
        )
        
        if (existingAnswer) {
          set((state) => ({
            answers: state.answers.map((a) =>
              a.id === existingAnswer.id
                ? { ...a, selectedOptionId: optionId, descriptiveAnswer, updatedAt: new Date() } : a),
          }))
        } else {
          const answer = {
            id,
            attemptId,
            questionId,
            selectedOptionId: optionId,
            descriptiveAnswer,
            updatedAt: new Date(),
          }
          set((state) => ({ answers: [...state.answers, answer] }))
        }

        try {
          const response = await fetch('/api/answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: existingAnswer?.id || id,
              attemptId,
              questionId,
              selectedOptionId: optionId,
              descriptiveAnswer
            }),
          });
          
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            console.error('Answer saving failed:', error);
          }
        } catch (err) {
          console.error('Answer saving network error:', err);
        }
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
          return ans.selectedOptionId !== null && ans.selectedOptionId !== undefined && ans.selectedOptionId !== question?.correctOptionId
        })
        
        const mistakeAnalysis = wrongAnswers.map((ans) => {
          const question = questions.find((q) => q.id === ans.questionId)
          if (!question) return null;
          
          // Safely access options - handle both string and array formats
            let options = [];
            if (typeof question.options === 'string') {
              try {
                options = JSON.parse(question.options) || [];
              } catch (e) {
                console.error('Failed to parse question.options JSON:', e);
                options = [];
              }
            } else if (Array.isArray(question.options)) {
              options = question.options;
            }
          
          const selectedOption = options?.find?.(o => o.id === ans.selectedOptionId)
          const correctOption = options?.find?.(o => o.id === question.correctOptionId)
          
          return {
            questionId: ans.questionId,
            explanation: `You selected "${selectedOption?.text || 'Unknown'}" but the correct answer is "${correctOption?.text || 'Unknown'}". ${
              question.topic ? `This question tests your understanding of ${question.topic}.` : ''
            } Review the concept and practice similar problems.`,
          }
        }).filter(Boolean)
        
        const topicCounts = {}
        wrongAnswers.forEach((ans) => {
          const question = questions.find((q) => q.id === ans.questionId)
          if (!question) return;
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
        // Also fetch bulk data to update activeTeacher info
        get().fetchData()
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
              activeTeacher: data.accessedUser || null,
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
          const foldersRes = await fetch(`/api/folders?userCode=${code}`)
          if (foldersRes.ok) {
            const foldersData = await foldersRes.json()
            set({ folders: (foldersData || []).map(f => ({ ...f, parentId: f.parent_id || f.parentId })) })
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
        isHydrated: state.isHydrated,
        currentRole: state.currentRole,
        currentUserCode: state.currentUserCode,
        accessedUsers: state.accessedUsers,
        activeTeacher: state.activeTeacher,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          // By default, every student can see exams for code 455770
          if (state.user?.role === 'student' && !state.currentUserCode) {
            state.currentUserCode = '455770';
          }
        }
      },
    }
  )
)
