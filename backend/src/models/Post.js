const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['need', 'offer'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    compensationType: { type: String, enum: ['free', 'paid', 'exchange', 'rent'], default: 'free' },
    compensationAmount: { type: Number },
    images: { type: [String], default: [] },
    location: { type: String, default: '' },
    likedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    bookmarkedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    status: { type: String, enum: ['active', 'deleted'], default: 'active' },
  },
  { timestamps: true }
);

postSchema.virtual('likesCount').get(function likesCount() {
  return this.likedBy.length;
});
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
