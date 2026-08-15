const mongoose = require('mongoose');

// A user-submitted report against another user, optionally tied to the post that
// triggered it. Purely a record for now — no moderation dashboard yet, but this
// gives you an audit trail to act on manually (or build a review queue against later).
const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    reason: {
      type: String,
      required: true,
      enum: ['spam', 'harassment', 'scam', 'inappropriate_content', 'fake_profile', 'other'],
    },
    details: { type: String, default: '' },
    status: { type: String, enum: ['open', 'reviewed'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
