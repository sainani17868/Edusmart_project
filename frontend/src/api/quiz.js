/**
 * EduSmart – Quiz API Functions
 *
 * Covers all quiz-related HTTP calls:
 *  getQuizzesByCourse, getQuiz, submitQuiz,
 *  getQuizResults, getUserQuizHistory, and helpers.
 */

import api from './axios';

/* ----------------------------------------------------------------
   Endpoints
   ---------------------------------------------------------------- */
const QUIZ_BASE = '/api/quizzes';

/* ----------------------------------------------------------------
   getQuizzesByCourse
   GET /api/quizzes?courseId=<courseId>
   Returns all quizzes belonging to the specified course.
   Each quiz includes: id, title, description, questionCount,
     timeLimit, passingScore, difficulty.
   ---------------------------------------------------------------- */
export async function getQuizzesByCourse(courseId) {
  if (!courseId) throw new Error('Course ID is required');
  const response = await api.get(QUIZ_BASE, { params: { courseId } });
  return response.data;
}

/* ----------------------------------------------------------------
   getQuizzesByTopic
   GET /api/quizzes?topicId=<topicId>
   Returns quizzes for a specific topic within a course.
   ---------------------------------------------------------------- */
export async function getQuizzesByTopic(topicId) {
  if (!topicId) throw new Error('Topic ID is required');
  const response = await api.get(QUIZ_BASE, { params: { topicId } });
  return response.data;
}

/* ----------------------------------------------------------------
   getQuiz
   GET /api/quizzes/:quizId
   Returns the full quiz object including questions (without correct
   answers – those are returned only after submission).
   ---------------------------------------------------------------- */
export async function getQuiz(quizId) {
  if (!quizId) throw new Error('Quiz ID is required');
  const response = await api.get(`${QUIZ_BASE}/${quizId}`);
  return response.data;
}

/* ----------------------------------------------------------------
   startQuizAttempt
   POST /api/quizzes/:quizId/attempts
   Creates a new attempt record on the server and returns an attemptId
   plus a server-side start timestamp (for accurate timing).
   Returns: { attemptId, startedAt, timeLimit }
   ---------------------------------------------------------------- */
export async function startQuizAttempt(quizId) {
  if (!quizId) throw new Error('Quiz ID is required');
  const response = await api.post(`${QUIZ_BASE}/${quizId}/attempts`);
  return response.data;
}

/* ----------------------------------------------------------------
   submitQuiz
   POST /api/quizzes/:quizId/submit
   Body:
   {
     attemptId: string,
     answers: [
       { questionId: string, selectedOption: string | number },
       ...
     ],
     timeSpentSeconds: number
   }
   Returns: { attemptId, score, passed, correctCount, totalCount }
   ---------------------------------------------------------------- */
export async function submitQuiz(quizId, answers, attemptId = null, timeSpentSeconds = null) {
  if (!quizId)  throw new Error('Quiz ID is required');
  if (!answers) throw new Error('Answers array is required');

  const payload = { answers };
  if (attemptId        !== null) payload.attemptId        = attemptId;
  if (timeSpentSeconds !== null) payload.timeSpentSeconds = timeSpentSeconds;

  const response = await api.post(`${QUIZ_BASE}/${quizId}/submit`, payload);
  return response.data;
}

/* ----------------------------------------------------------------
   getQuizResults
   GET /api/quizzes/attempts/:attemptId
   Returns the detailed result for a specific attempt:
   score, answers with correct/incorrect flags, explanations, etc.
   ---------------------------------------------------------------- */
export async function getQuizResults(attemptId) {
  if (!attemptId) throw new Error('Attempt ID is required');
  const response = await api.get(`${QUIZ_BASE}/attempts/${attemptId}`);
  return response.data;
}

/* ----------------------------------------------------------------
   getUserQuizHistory
   GET /api/quizzes/history
   Returns all quiz attempts by the authenticated user, sorted by date.
   Params: { page, limit, courseId, passed }
   ---------------------------------------------------------------- */
export async function getUserQuizHistory(params = {}) {
  const response = await api.get(`${QUIZ_BASE}/history`, { params });
  return response.data;
}

/* ----------------------------------------------------------------
   getQuizLeaderboard
   GET /api/quizzes/:quizId/leaderboard
   Returns the top scores for a quiz.
   ---------------------------------------------------------------- */
export async function getQuizLeaderboard(quizId, params = {}) {
  if (!quizId) throw new Error('Quiz ID is required');
  const response = await api.get(`${QUIZ_BASE}/${quizId}/leaderboard`, { params });
  return response.data;
}

/* ----------------------------------------------------------------
   getQuizAnalytics
   GET /api/quizzes/:quizId/analytics
   Returns aggregate statistics: avg score, pass rate, common mistakes.
   (Admin / instructor endpoint)
   ---------------------------------------------------------------- */
export async function getQuizAnalytics(quizId) {
  if (!quizId) throw new Error('Quiz ID is required');
  const response = await api.get(`${QUIZ_BASE}/${quizId}/analytics`);
  return response.data;
}

/* ----------------------------------------------------------------
   retakeQuiz
   POST /api/quizzes/:quizId/retake
   Signals the intention to retake (may reset progress or create new attempt).
   ---------------------------------------------------------------- */
export async function retakeQuiz(quizId) {
  if (!quizId) throw new Error('Quiz ID is required');
  const response = await api.post(`${QUIZ_BASE}/${quizId}/retake`);
  return response.data;
}

/* ----------------------------------------------------------------
   saveQuizProgress (auto-save)
   PUT /api/quizzes/:quizId/attempts/:attemptId/progress
   Body: { answers, currentQuestion, timeRemainingSeconds }
   Saves mid-quiz progress so the user can resume after page refresh.
   ---------------------------------------------------------------- */
export async function saveQuizProgress(quizId, attemptId, progressData) {
  if (!quizId || !attemptId) throw new Error('Quiz ID and Attempt ID are required');
  const response = await api.put(
    `${QUIZ_BASE}/${quizId}/attempts/${attemptId}/progress`,
    progressData
  );
  return response.data;
}

/* ----------------------------------------------------------------
   getResumeableAttempt
   GET /api/quizzes/:quizId/attempts/current
   Returns an in-progress attempt if one exists, so the user can resume.
   ---------------------------------------------------------------- */
export async function getResumeableAttempt(quizId) {
  if (!quizId) throw new Error('Quiz ID is required');
  const response = await api.get(`${QUIZ_BASE}/${quizId}/attempts/current`);
  return response.data;
}
