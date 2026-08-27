const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema(
  {
    co2: { type: Number, required: true },
    water: { type: Number, required: true },
    electricity: { type: Number, required: true },
    material: { type: Number, required: true },
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    productType: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    materials: [{ type: String, trim: true }],
    steps: [{ type: String, trim: true }],
    baseline: { type: metricSchema, required: true },
    optimized: { type: metricSchema, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

planSchema.index({ title: 'text', description: 'text', productType: 'text' });

planSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'plan',
  count: true,
});

planSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Plan', planSchema);