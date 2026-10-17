/**
 * @module models/Progress
 * @description Mongoose Progress model tracking a student's course-level learning progress.
 */

import mongoose from 'mongoose';

// ─── Progress Schema ──────────────────────────────────────────────────────────

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    completedTopics: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    quizAttempts: {
      type: Number,
      default: 0,
      min: [0, 'Quiz attempts cannot be negative'],
    },
    averageScore: {
      type: Number,
      default: 0,
      min: [0, 'Average score cannot be negative'],
      max: [100, 'Average score cannot exceed 100'],
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Unique constraint: one progress record per student per course
progressSchema.index({ student: 1, course: 1 }, { unique: true });
progressSchema.index({ student: 1 });
progressSchema.index({ course: 1 });
progressSchema.index({ lastActivity: -1 });

// ─── Virtual Properties ───────────────────────────────────────────────────────

/**
 * Virtual: number of completed topics.
 */
progressSchema.virtual('completedTopicCount').get(function () {
  return this.completedTopics?.length ?? 0;
});

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Find or create a Progress document for a given student and course.
 * @param {ObjectId} studentId
 * @param {ObjectId} courseId
 * @returns {Promise<Progress>}
 */
progressSchema.statics.findOrCreate = async function (studentId, courseId) {
  let progress = await this.findOne({ student: studentId, course: courseId });

  if (!progress) {
    progress = await this.create({
      student: studentId,
      course: courseId,
    });
  }

  return progress;
};

/**
 * Update the average score using a running weighted average.
 * @param {ObjectId} studentId
 * @param {ObjectId} courseId
 * @param {number} newScore - The new quiz score (0–100)
 * @returns {Promise<Progress>}
 */
progressSchema.statics.recordQuizAttempt = async function (studentId, courseId, newScore) {
  const progress = await this.findOrCreate(studentId, courseId);

  const totalAttempts = progress.quizAttempts + 1;
  const updatedAvg =
    (progress.averageScore * progress.quizAttempts + newScore) / totalAttempts;

  progress.quizAttempts = totalAttempts;
  progress.averageScore = Math.round(updatedAvg * 100) / 100;
  progress.lastActivity = new Date();

  return progress.save();
};

// ─── Model Export ─────────────────────────────────────────────────────────────

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
