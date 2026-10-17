/**
 * @module models/Quiz
 * @description Mongoose Quiz model with questions, options, and scoring configuration.
 */

import mongoose from 'mongoose';

// ─── Option Sub-Schema ────────────────────────────────────────────────────────

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { _id: true }
);

// ─── Question Sub-Schema ──────────────────────────────────────────────────────

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: [1000, 'Question text cannot exceed 1000 characters'],
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: function (options) {
          // Must have 2–6 options and exactly one correct answer
          if (options.length < 2 || options.length > 6) return false;
          const correctCount = options.filter((o) => o.isCorrect).length;
          return correctCount === 1;
        },
        message:
          'Each question must have between 2 and 6 options with exactly one correct answer.',
      },
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Explanation cannot exceed 1000 characters'],
    },
    topic: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: "Difficulty must be 'easy', 'medium', or 'hard'",
      },
      default: 'medium',
    },
  },
  { _id: true }
);

// ─── Quiz Schema ──────────────────────────────────────────────────────────────

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [200, 'Quiz title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Associated course is required'],
    },
    topic: {
      type: String,
      trim: true,
      default: '',
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: function (qs) {
          return qs.length >= 1;
        },
        message: 'A quiz must have at least one question.',
      },
    },
    timeLimit: {
      type: Number,
      min: [1, 'Time limit must be at least 1 minute'],
      max: [180, 'Time limit cannot exceed 180 minutes'],
      default: 30, // minutes
    },
    passingScore: {
      type: Number,
      min: [0, 'Passing score cannot be negative'],
      max: [100, 'Passing score cannot exceed 100'],
      default: 60, // percentage
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Quiz creator is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

quizSchema.index({ course: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ topic: 1 });

// ─── Virtual Properties ───────────────────────────────────────────────────────

/**
 * Virtual: total number of questions in this quiz.
 */
quizSchema.virtual('questionCount').get(function () {
  return this.questions?.length ?? 0;
});

// ─── Model Export ─────────────────────────────────────────────────────────────

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
