import mongoose from 'mongoose';
import { LEAD_STAGES, LEAD_SOURCES, LEAD_INTENTS } from './enums.js';

const { ObjectId } = mongoose.Schema.Types;

const noteSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, maxlength: 2000 },
    author: { type: ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Append-only audit trail shown in the lead drawer
const activitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // created | stage | assigned | follow_up | converted
    from: String,
    to: String,
    by: { type: ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    message: { type: String, maxlength: 2000 },
    intent: { type: String, enum: LEAD_INTENTS, default: 'general' },
    preferredDate: Date,
    source: { type: String, enum: LEAD_SOURCES, default: 'website' },
    property: { type: ObjectId, ref: 'Property' },
    status: { type: String, enum: LEAD_STAGES, default: 'new' },
    assignedTo: { type: ObjectId, ref: 'User' },
    followUpDate: { type: Date, index: true },
    dealValue: { type: Number, min: 0 },
    lostReason: String,
    closedAt: Date,
    customer: { type: ObjectId, ref: 'Customer' },
    notes: [noteSchema],
    activity: [activitySchema],
    createdBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ createdAt: -1 });

export const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
