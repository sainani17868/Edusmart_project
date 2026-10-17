/**
 * EduSmart – Courses API Functions
 *
 * Covers all course-related HTTP calls:
 *  getCourses, getCourse, getCourseTopics, enrollCourse,
 *  plus supplemental helpers for search, reviews, and progress.
 */

import api from './axios';

/* ----------------------------------------------------------------
   Endpoints
   ---------------------------------------------------------------- */
const COURSES_BASE = '/api/courses';

/* ----------------------------------------------------------------
   getCourses
   GET /api/courses
   Params: { page, limit, category, difficulty, search, sort }
   Returns: { courses: [], total, page, totalPages }
   ---------------------------------------------------------------- */
export async function getCourses(params = {}) {
  const response = await api.get(COURSES_BASE, { params });
  return response.data;
}

/* ----------------------------------------------------------------
   getCourse
   GET /api/courses/:id
   Returns a single course with full details (description, instructor, etc.)
   ---------------------------------------------------------------- */
export async function getCourse(id) {
  if (!id) throw new Error('Course ID is required');
  const response = await api.get(`${COURSES_BASE}/${id}`);
  return response.data;
}

/* ----------------------------------------------------------------
   getCourseTopics
   GET /api/courses/:courseId/topics
   Returns ordered list of topics/modules for the course.
   ---------------------------------------------------------------- */
export async function getCourseTopics(courseId) {
  if (!courseId) throw new Error('Course ID is required');
  const response = await api.get(`${COURSES_BASE}/${courseId}/topics`);
  return response.data;
}

/* ----------------------------------------------------------------
   enrollCourse
   POST /api/courses/:courseId/enroll
   Enrolls the authenticated user in the given course.
   Returns: { enrollment, message }
   ---------------------------------------------------------------- */
export async function enrollCourse(courseId) {
  if (!courseId) throw new Error('Course ID is required');
  const response = await api.post(`${COURSES_BASE}/${courseId}/enroll`);
  return response.data;
}

/* ----------------------------------------------------------------
   unenrollCourse
   DELETE /api/courses/:courseId/enroll
   Removes the authenticated user's enrollment.
   ---------------------------------------------------------------- */
export async function unenrollCourse(courseId) {
  if (!courseId) throw new Error('Course ID is required');
  const response = await api.delete(`${COURSES_BASE}/${courseId}/enroll`);
  return response.data;
}

/* ----------------------------------------------------------------
   getEnrolledCourses
   GET /api/courses/enrolled
   Returns all courses the current user is enrolled in.
   ---------------------------------------------------------------- */
export async function getEnrolledCourses() {
  const response = await api.get(`${COURSES_BASE}/enrolled`);
  return response.data;
}

/* ----------------------------------------------------------------
   getCourseProgress
   GET /api/courses/:courseId/progress
   Returns the user's progress data for a specific course.
   ---------------------------------------------------------------- */
export async function getCourseProgress(courseId) {
  if (!courseId) throw new Error('Course ID is required');
  const response = await api.get(`${COURSES_BASE}/${courseId}/progress`);
  return response.data;
}

/* ----------------------------------------------------------------
   updateTopicProgress
   PUT /api/courses/:courseId/topics/:topicId/progress
   Body: { completed, timeSpentSeconds }
   Marks a topic as viewed / completed.
   ---------------------------------------------------------------- */
export async function updateTopicProgress(courseId, topicId, progressData) {
  if (!courseId || !topicId) throw new Error('Course ID and Topic ID are required');
  const response = await api.put(
    `${COURSES_BASE}/${courseId}/topics/${topicId}/progress`,
    progressData
  );
  return response.data;
}

/* ----------------------------------------------------------------
   getCourseCategories
   GET /api/courses/categories
   Returns all available course categories.
   ---------------------------------------------------------------- */
export async function getCourseCategories() {
  const response = await api.get(`${COURSES_BASE}/categories`);
  return response.data;
}

/* ----------------------------------------------------------------
   getCourseReviews
   GET /api/courses/:courseId/reviews
   Returns paginated reviews for a course.
   ---------------------------------------------------------------- */
export async function getCourseReviews(courseId, params = {}) {
  if (!courseId) throw new Error('Course ID is required');
  const response = await api.get(`${COURSES_BASE}/${courseId}/reviews`, { params });
  return response.data;
}

/* ----------------------------------------------------------------
   submitCourseReview
   POST /api/courses/:courseId/reviews
   Body: { rating (1–5), comment }
   ---------------------------------------------------------------- */
export async function submitCourseReview(courseId, rating, comment) {
  if (!courseId) throw new Error('Course ID is required');
  const response = await api.post(`${COURSES_BASE}/${courseId}/reviews`, {
    rating,
    comment,
  });
  return response.data;
}

/* ----------------------------------------------------------------
   getFeaturedCourses
   GET /api/courses/featured
   Returns a curated list of featured / recommended courses.
   ---------------------------------------------------------------- */
export async function getFeaturedCourses() {
  const response = await api.get(`${COURSES_BASE}/featured`);
  return response.data;
}

/* ----------------------------------------------------------------
   searchCourses
   GET /api/courses/search?q=<query>
   Full-text search across course titles, descriptions, and tags.
   ---------------------------------------------------------------- */
export async function searchCourses(query, params = {}) {
  const response = await api.get(`${COURSES_BASE}/search`, {
    params: { q: query, ...params },
  });
  return response.data;
}
