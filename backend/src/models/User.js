const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    collegeEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, default: 'Undeclared' },
    semester: { type: String, default: '1st Semester' },
    password: { type: String, default: null }, // hashed; null for Google-only accounts
    profileImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    availability: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    // Expo push token for this user's device, used to deliver notifications when the app
    // is backgrounded/closed. Registered by the client after login via POST /api/auth/push-token.
    expoPushToken: { type: String, default: null },
    // Users this account has blocked. Blocking is one-directional but enforced both ways
    // when checking whether two users can message each other (see routes/conversations.js
    // and sockets/index.js's isBlockedEitherWay checks).
    blockedUsers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  const obj = this.toObject({ virtuals: true });
  obj._id = obj._id.toString();
  delete obj.password;
  delete obj.expoPushToken;
  delete obj.blockedUsers;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
