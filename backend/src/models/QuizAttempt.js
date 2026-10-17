/**
 * @module models/QuizAttempt
 * @description Mongoose QuizAttempt model tracking individual student quiz submissions.
 */

import mongoose from 'mongoose';

// ─── Answer Sub-Schema ────────────────────────────────────────────────────────

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Question ID is required'],
    },
    selectedOption: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // null means skipped
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
    },
    topic: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

// ─── QuizAttempt Schema ───────────────────────────────────────────────────────

const quizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz reference is required'],
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    score: {
      type: Number,
      required: true,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: [0, 'Total questions cannot be negative'],
      default: 0,
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: [0, 'Correct answers cannot be negative'],
      default: 0,
    },
    weakTopics: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    timeTaken: {
      type: Number, // seconds
      min: [0, 'Time taken cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

quizAttemptSchema.index({ student: 1, quiz: 1 });
quizAttemptSchema.index({ student: 1, completedAt: -1 });
quizAttemptSchema.index({ quiz: 1 });
quizAttemptSchema.index({ student: 1 });

// ─── Virtual Properties ───────────────────────────────────────────────────────

/**
 * Virtual: whether the student passed the quiz.
 * Requires the quiz passingScore — populated via .populate('quiz').
 */
quizAttemptSchema.virtual('passed').get(function () {
  if (this.quiz && typeof this.quiz === 'object' && this.quiz.passingScore != null) {
    return this.score >= this.quiz.passingScore;
  }
  return null; // Unknown unless quiz is populated
});

/**
 * Virtual: time taken formatted as MM:SS string.
 */
quizAttemptSchema.virtual('timeTakenFormatted').get(function () {
  const mins = Math.floor(this.timeTaken / 60);
  const secs = this.timeTaken % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

// ─── Pre-save Middleware ──────────────────────────────────────────────────────

/**
 * Auto-compute weakTopics from answers where isCorrect is false.
 */
quizAttemptSchema.pre('save', function (next) {
  if (this.isModified('answers')) {
    const incorrect = this.answers.filter((a) => !a.isCorrect && a.topic);
    const topicCounts = incorrect.reduce((acc, a) => {
      acc[a.topic] = (acc[a.topic] || 0) + 1;
      return acc;
    }, {});
    // Topics with more than one incorrect answer are considered "weak"
    this.weakTopics = Object.entries(topicCounts)
      .filter(([, count]) => count >= 1)
      .map(([topic]) => topic);
  }
  next();
});

// ─── Model Export ─────────────────────────────────────────────────────────────

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;
