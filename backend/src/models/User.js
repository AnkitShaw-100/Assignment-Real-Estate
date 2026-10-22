import mongoose from 'mongoose';
import { ROLES } from './enums.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // bcrypt hash; never returned by queries unless explicitly selected
    passwordHash: { type: String, required: true, select: false },
    avatar: String,
    phone: { type: String, trim: true },
    role: { type: String, enum: ROLES, default: 'buyer', index: true },
    title: { type: String, trim: true }, // e.g. "Senior agent", shown on property pages
    savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.methods.isStaff = function isStaff() {
  return this.role === 'agent' || this.role === 'admin';
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
