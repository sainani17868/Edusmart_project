/**
 * @module models/Course
 * @description Mongoose Course model with nested topics and associated quizzes.
 */

import mongoose from 'mongoose';

// ─── Resource Sub-Schema ──────────────────────────────────────────────────────

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['video', 'article', 'pdf', 'link', 'exercise'],
        message: 'Resource type must be one of: video, article, pdf, link, exercise',
      },
      default: 'link',
    },
  },
  { _id: true }
);

// ─── Topic Sub-Schema ─────────────────────────────────────────────────────────

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
      maxlength: [200, 'Topic title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      required: [true, 'Topic order is required'],
      min: [0, 'Order must be a non-negative number'],
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
  },
  { _id: true }
);

// ─── Course Schema ────────────────────────────────────────────────────────────

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Course title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Course category is required'],
      trim: true,
    },
    level: {
      type: String,
      required: [true, 'Course level is required'],
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: "Level must be 'beginner', 'intermediate', or 'advanced'",
      },
    },
    thumbnail: {
      type: String,
      default: '',
      trim: true,
    },
    topics: {
      type: [topicSchema],
      default: [],
    },
    quizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Course creator is required'],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ createdBy: 1 });
courseSchema.index({ title: 'text', description: 'text' }); // Full-text search

// ─── Virtual Properties ───────────────────────────────────────────────────────

/**
 * Virtual: total number of topics in the course.
 */
courseSchema.virtual('topicCount').get(function () {
  return this.topics?.length ?? 0;
});

/**
 * Virtual: total number of associated quizzes.
 */
courseSchema.virtual('quizCount').get(function () {
  return this.quizzes?.length ?? 0;
});

// ─── Pre-save Middleware ──────────────────────────────────────────────────────

/**
 * Sort topics by their `order` field before saving.
 */
courseSchema.pre('save', function (next) {
  if (this.isModified('topics')) {
    this.topics.sort((a, b) => a.order - b.order);
  }
  next();
});

// ─── Model Export ─────────────────────────────────────────────────────────────

const Course = mongoose.model('Course', courseSchema);

export default Course;
