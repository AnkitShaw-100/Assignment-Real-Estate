import mongoose from 'mongoose';
import { CUSTOMER_TYPES, INTERACTION_KINDS } from './enums.js';

const { ObjectId } = mongoose.Schema.Types;

const interactionSchema = new mongoose.Schema({
  kind: { type: String, enum: INTERACTION_KINDS, required: true },
  summary: { type: String, required: true, maxlength: 2000 },
  at: { type: Date, default: Date.now },
  by: { type: ObjectId, ref: 'User' },
});

const dealSchema = new mongoose.Schema(
  {
    property: { type: ObjectId, ref: 'Property' },
    lead: { type: ObjectId, ref: 'Lead' },
    value: { type: Number, required: true, min: 0 },
    closedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: { type: String, trim: true },
    type: { type: String, enum: CUSTOMER_TYPES, default: 'buyer' },
    requirements: {
      budgetMin: { type: Number, min: 0 },
      budgetMax: { type: Number, min: 0 },
      locations: [{ type: String, trim: true }],
      types: [{ type: String, trim: true }],
      bedrooms: { type: Number, min: 0 },
    },
    assignedAgent: { type: ObjectId, ref: 'User', index: true },
    leads: [{ type: ObjectId, ref: 'Lead' }],
    deals: [dealSchema],
    interactions: [interactionSchema],
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
