// Strips fields that must never leave a user's own session and get attached to *another* user's
// view of the data — post authors, booking participants, chat partners, reviewers, etc. all get
// populated from the full local `users` collection, so every service that attaches a user object
// to something else's response must sanitize through this first.
//
// `password` (legacy plaintext, pre password-hashing accounts — see authService.login's migration
// path) is stripped alongside passwordHash/passwordSalt so an unmigrated account's plaintext
// password can't leak into another user's feed/booking/chat/review data before its owner next logs
// in and gets migrated.
export const publicUser = (user) => {
  if (!user) return null;
  const { passwordHash, passwordSalt, password, ...rest } = user;
  return rest;
};

export default publicUser;
