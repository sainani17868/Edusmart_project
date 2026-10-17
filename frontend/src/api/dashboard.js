/**
 * EduSmart – Dashboard & ML Insights API Functions
 *
 * Covers all dashboard-related HTTP calls including:
 *  - Aggregate stats for the user's learning activity
 *  - AI/ML-powered personalised recommendations
 *  - Weak topic identification from quiz performance
 *  - ML prediction endpoint for adaptive learning
 *  - Granular progress tracking
 */

import api from './axios';

/* ----------------------------------------------------------------
   Endpoints
   ---------------------------------------------------------------- */
const DASHBOARD_BASE = '/api/dashboard';
const ML_BASE        = '/api/ml';

/* ================================================================
   DASHBOARD STATS
   ================================================================ */

/* ----------------------------------------------------------------
   getDashboardStats
   GET /api/dashboard/stats
   Returns aggregate statistics for the authenticated user:
   {
     coursesEnrolled,   coursesCompleted,
     quizzesTaken,      quizzesPassed,
     averageScore,      totalStudyTimeMinutes,
     currentStreak,     longestStreak,
     pointsEarned,      rank
   }
   ---------------------------------------------------------------- */
export async function getDashboardStats() {
  const response = await api.get(`${DASHBOARD_BASE}/stats`);
  return response.data;
}

/* ----------------------------------------------------------------
   getActivitySummary
   GET /api/dashboard/activity
   Returns recent learning activity items (last N events).
   Params: { limit, days }
   ---------------------------------------------------------------- */
export async function getActivitySummary(params = {}) {
  const response = await api.get(`${DASHBOARD_BASE}/activity`, { params });
  return response.data;
}

/* ================================================================
   PROGRESS TRACKING
   ================================================================ */

/* ----------------------------------------------------------------
   getProgress
   GET /api/dashboard/progress
   Returns detailed progress data across all enrolled courses:
   {
     courses: [
       {
         courseId, title, progress (0-100),
         topicsCompleted, topicsTotal,
         lastAccessedAt, nextTopic
       }
     ],
     weeklyStudyData: [{ date, minutes }],     // last 7 days
     monthlyProgress: [{ month, score }]        // last 6 months
   }
   ---------------------------------------------------------------- */
export async function getProgress() {
  const response = await api.get(`${DASHBOARD_BASE}/progress`);
  return response.data;
}

/* ----------------------------------------------------------------
   getCourseProgress
   GET /api/dashboard/progress/:courseId
   Returns progress details for a single course.
   ---------------------------------------------------------------- */
export async function getCourseProgress(courseId) {
  if (!courseId) throw new Error('Course ID is required');
  const response = await api.get(`${DASHBOARD_BASE}/progress/${courseId}`);
  return response.data;
}

/* ----------------------------------------------------------------
   getStudyStreak
   GET /api/dashboard/streak
   Returns the user's current and longest study streak.
   ---------------------------------------------------------------- */
export async function getStudyStreak() {
  const response = await api.get(`${DASHBOARD_BASE}/streak`);
  return response.data;
}

/* ================================================================
   AI / ML INSIGHTS
   ================================================================ */

/* ----------------------------------------------------------------
   getRecommendations
   GET /api/dashboard/recommendations
   Returns AI-personalised course and quiz recommendations based on
   the user's history, quiz scores, and learning patterns.
   Returns:
   {
     courses:     [ { courseId, title, reason, matchScore } ],
     quizzes:     [ { quizId, title, topic, reason } ],
     topics:      [ { topicId, name, courseId, reason } ]
   }
   ---------------------------------------------------------------- */
export async function getRecommendations() {
  const response = await api.get(`${DASHBOARD_BASE}/recommendations`);
  return response.data;
}

/* ----------------------------------------------------------------
   getWeakTopics
   GET /api/dashboard/weak-topics
   Returns topics where the user consistently performs below threshold.
   Each item includes:
   {
     topicId, topicName, courseId, courseName,
     averageScore, attemptsCount, suggestedResources
   }
   ---------------------------------------------------------------- */
export async function getWeakTopics() {
  const response = await api.get(`${DASHBOARD_BASE}/weak-topics`);
  return response.data;
}

/* ----------------------------------------------------------------
   getStrengthTopics
   GET /api/dashboard/strength-topics
   Complementary to weak topics — shows areas of mastery.
   ---------------------------------------------------------------- */
export async function getStrengthTopics() {
  const response = await api.get(`${DASHBOARD_BASE}/strength-topics`);
  return response.data;
}

/* ----------------------------------------------------------------
   getMLPrediction
   POST /api/ml/predict
   Sends user feature vector to the ML model and receives a prediction.

   `features` object shape (all optional, server fills defaults):
   {
     averageScore:          number,   // 0–100
     totalStudyMinutes:     number,
     quizAttempts:          number,
     coursesCompleted:      number,
     streakDays:            number,
     weakTopicCount:        number,
     timeOfDayPreference:   string,   // 'morning' | 'afternoon' | 'evening'
     learningStyle:         string,   // 'visual' | 'reading' | 'practice'
     [key: string]:         any       // extendable for new features
   }

   Returns:
   {
     predictedSuccess:     number,   // 0–1 probability
     recommendedDifficulty: string,  // 'beginner' | 'intermediate' | 'advanced'
     estimatedCompletionDays: number,
     confidenceScore:      number,   // 0–1
     insights:             string[]  // human-readable insight messages
   }
   ---------------------------------------------------------------- */
export async function getMLPrediction(features = {}) {
  const response = await api.post(`${ML_BASE}/predict`, { features });
  return response.data;
}

/* ----------------------------------------------------------------
   getAdaptiveDifficulty
   GET /api/ml/adaptive-difficulty
   Returns the ML-recommended difficulty level for the next quiz/topic.
   ---------------------------------------------------------------- */
export async function getAdaptiveDifficulty() {
  const response = await api.get(`${ML_BASE}/adaptive-difficulty`);
  return response.data;
}

/* ----------------------------------------------------------------
   getPersonalisedStudyPlan
   GET /api/ml/study-plan
   Returns a day-by-day study plan generated by the ML model.
   Params: { targetDays, goalCourseId }
   ---------------------------------------------------------------- */
export async function getPersonalisedStudyPlan(params = {}) {
  const response = await api.get(`${ML_BASE}/study-plan`, { params });
  return response.data;
}

/* ----------------------------------------------------------------
   submitLearningFeedback
   POST /api/ml/feedback
   Records explicit user feedback (thumbs up/down on recommendations).
   Body: { itemType, itemId, feedback: 'positive' | 'negative', reason? }
   ---------------------------------------------------------------- */
export async function submitLearningFeedback(feedbackData) {
  const response = await api.post(`${ML_BASE}/feedback`, feedbackData);
  return response.data;
}

/* ================================================================
   LEADERBOARD & SOCIAL
   ================================================================ */

/* ----------------------------------------------------------------
   getLeaderboard
   GET /api/dashboard/leaderboard
   Returns the top learners with their points and ranks.
   Params: { period: 'week' | 'month' | 'all', limit }
   ---------------------------------------------------------------- */
export async function getLeaderboard(params = {}) {
  const response = await api.get(`${DASHBOARD_BASE}/leaderboard`, { params });
  return response.data;
}

/* ----------------------------------------------------------------
   getAchievements
   GET /api/dashboard/achievements
   Returns all achievements earned and locked by the user.
   ---------------------------------------------------------------- */
export async function getAchievements() {
  const response = await api.get(`${DASHBOARD_BASE}/achievements`);
  return response.data;
}

/* ----------------------------------------------------------------
   getNotifications
   GET /api/dashboard/notifications
   Returns unread notifications for the user.
   Params: { limit, unreadOnly }
   ---------------------------------------------------------------- */
export async function getNotifications(params = {}) {
  const response = await api.get(`${DASHBOARD_BASE}/notifications`, { params });
  return response.data;
}

/* ----------------------------------------------------------------
   markNotificationsRead
   PUT /api/dashboard/notifications/read
   Body: { ids: string[] }  (empty = mark all as read)
   ---------------------------------------------------------------- */
export async function markNotificationsRead(ids = []) {
  const response = await api.put(`${DASHBOARD_BASE}/notifications/read`, { ids });
  return response.data;
}
