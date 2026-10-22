import mongoose from 'mongoose';
import { TASK_PRIORITIES, TASK_STATUSES } from './enums.js';

const { ObjectId } = mongoose.Schema.Types;

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    dueAt: { type: Date, required: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    status: { type: String, enum: TASK_STATUSES, default: 'open' },
    assignee: { type: ObjectId, ref: 'User', required: true },
    lead: { type: ObjectId, ref: 'Lead' },
    customer: { type: ObjectId, ref: 'Customer' },
    createdBy: { type: ObjectId, ref: 'User' },
    completedAt: Date,
  },
  { timestamps: true },
);

taskSchema.index({ assignee: 1, status: 1, dueAt: 1 });

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
