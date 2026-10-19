import mongoose from 'mongoose';
import {
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
} from './enums.js';
import { slugify } from '../utils/slugify.js';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: String, // Cloudinary id; absent for seeded Unsplash images
    alt: String,
  },
  { _id: false },
);

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: String, enum: PROPERTY_CATEGORIES, required: true },
    type: { type: String, enum: PROPERTY_TYPES, required: true },
    purpose: { type: String, enum: PROPERTY_PURPOSES, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    location: {
      address: { type: String, trim: true },
      area: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
    bedrooms: { type: Number, min: 0, default: 0 },
    bathrooms: { type: Number, min: 0, default: 0 },
    areaSqft: { type: Number, min: 0 },
    parking: { type: Number, min: 0, default: 0 },
    yearBuilt: Number,
    amenities: [{ type: String, trim: true }],
    images: [imageSchema],
    coverIndex: { type: Number, default: 0 },
    status: { type: String, enum: PROPERTY_STATUSES, default: 'available', index: true },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

propertySchema.index({ status: 1, category: 1, type: 1, purpose: 1, price: 1 });
propertySchema.index({ 'location.city': 1 });

propertySchema.virtual('cover').get(function cover() {
  return this.images?.[this.coverIndex] ?? this.images?.[0] ?? null;
});

// Slug = readable title + short random suffix, so two "Modern Villa" listings never collide.
propertySchema.pre('validate', function setSlug() {
  if (!this.slug || this.isModified('title')) {
    this.slug = `${slugify(this.title ?? 'property')}-${Math.random().toString(36).slice(2, 7)}`;
  }
});

export const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);
