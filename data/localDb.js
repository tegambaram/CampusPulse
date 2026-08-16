import AsyncStorage from '@react-native-async-storage/async-storage';
import { hashPassword, randomToken } from '../utils/crypto';

// A tiny local "database" that fully replaces the network backend. Every collection is kept as a
// JSON array in AsyncStorage under its own key, mirroring the shape of the old MongoDB documents
// (_id, createdAt, ref fields, etc.) so the existing mappers/screens keep working unchanged.
// On first launch it seeds itself with a batch of demo users, posts, conversations and more so the
// app is immediately populated — no server, no MongoDB Atlas required.

const STORAGE_PREFIX = '@campuspulse/';
const SEED_FLAG_KEY = `${STORAGE_PREFIX}seeded`;

const COLLECTIONS = ['users', 'categories', 'posts', 'conversations', 'messages', 'notifications', 'bookings', 'reviews', 'sessions'];

let cache = null; // { users: [...], posts: [...], ... } once loaded into memory
let loadPromise = null;

const genId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickSome = (arr, count) => [...arr].sort(() => 0.5 - Math.random()).slice(0, Math.max(0, count));
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const CATEGORY_SEED = [
  { name: 'Programming', icon: 'code-slash-outline' },
  { name: 'Math', icon: 'calculator-outline' },
  { name: 'Design', icon: 'color-palette-outline' },
  { name: 'Tutoring', icon: 'school-outline' },
  { name: 'Electronics', icon: 'hardware-chip-outline' },
  { name: 'Language', icon: 'language-outline' },
  { name: 'Music', icon: 'musical-notes-outline' },
  { name: 'Miscellaneous', icon: 'ellipsis-horizontal-outline' },
];

const USER_SEED = [
  { name: 'Aarav Mehta', department: 'Computer Science', semester: '5th Semester' },
  { name: 'Priya Sharma', department: 'Electronics & Comm.', semester: '3rd Semester' },
  { name: 'Rohan Kapoor', department: 'Mechanical Engineering', semester: '6th Semester' },
  { name: 'Sneha Reddy', department: 'Computer Science', semester: '4th Semester' },
  { name: 'Karan Verma', department: 'Civil Engineering', semester: '7th Semester' },
  { name: 'Ishita Nair', department: 'Fine Arts', semester: '2nd Semester' },
  { name: 'Aditya Rao', department: 'Information Technology', semester: '5th Semester' },
  { name: 'Meera Iyer', department: 'Music & Performing Arts', semester: '3rd Semester' },
  { name: 'Vikram Singh', department: 'Business Administration', semester: '4th Semester' },
  { name: 'Ananya Gupta', department: 'Computer Science', semester: '6th Semester' },
];

const POST_SEED = [
  { type: 'need', title: 'Need Scientific Calculator', category: 'Math', compensationType: 'free' },
  { type: 'offer', title: 'Offering C Programming Tutoring', category: 'Programming', compensationType: 'paid', compensationAmount: 200 },
  { type: 'need', title: 'Need Assignment Help in DBMS', category: 'Tutoring', compensationType: 'exchange' },
  { type: 'offer', title: 'Offering Resume Review', category: 'Miscellaneous', compensationType: 'free' },
  { type: 'need', title: 'Need Bike Ride to Campus', category: 'Miscellaneous', compensationType: 'paid', compensationAmount: 50 },
  { type: 'offer', title: 'Offering Photoshop Editing', category: 'Design', compensationType: 'rent', compensationAmount: 150 },
  { type: 'need', title: 'Need DBMS Notes', category: 'Tutoring', compensationType: 'free' },
  { type: 'offer', title: 'Offering Guitar Classes', category: 'Music', compensationType: 'paid', compensationAmount: 300 },
  { type: 'need', title: 'Need Java Tutor', category: 'Programming', compensationType: 'paid', compensationAmount: 250 },
  { type: 'offer', title: 'Offering Flutter Classes', category: 'Programming', compensationType: 'exchange' },
  { type: 'need', title: 'Need Laptop Charger (Dell)', category: 'Electronics', compensationType: 'free' },
  { type: 'offer', title: 'Offering Graphic Design', category: 'Design', compensationType: 'paid', compensationAmount: 400 },
  { type: 'need', title: 'Need Spanish Speaking Partner', category: 'Language', compensationType: 'exchange' },
  { type: 'offer', title: 'Offering Spoken English Practice', category: 'Language', compensationType: 'free' },
  { type: 'need', title: 'Need Arduino Kit for Project', category: 'Electronics', compensationType: 'rent', compensationAmount: 100 },
  { type: 'offer', title: 'Offering Circuit Debugging Help', category: 'Electronics', compensationType: 'free' },
  { type: 'need', title: 'Need Statistics Tutor', category: 'Math', compensationType: 'paid', compensationAmount: 200 },
  { type: 'offer', title: 'Offering Calculus Doubt Clearing', category: 'Math', compensationType: 'exchange' },
  { type: 'need', title: 'Need Someone for Group Project UI', category: 'Design', compensationType: 'exchange' },
  { type: 'offer', title: 'Offering Logo Design Services', category: 'Design', compensationType: 'paid', compensationAmount: 350 },
];

const DESCRIPTIONS = {
  need: 'Looking for someone on campus who can help with this soon. Happy to discuss timing and details over chat.',
  offer: 'Experienced and happy to help fellow students. Message me to work out timing and specifics.',
};

const LOCATIONS = ['Block A Hostel', 'Block C Hostel', 'Central Library', 'CS Department', 'Main Gate', 'Amphitheatre', 'Innovation Lab', 'Design Studio, Block A', 'Online / Discord'];

// The one login every seeded user shares — surfaced to the user as "the" demo account.
export const DEMO_PASSWORD = 'password123';

const buildSeed = async () => {
  const categories = CATEGORY_SEED.map((c) => ({ _id: genId(), ...c, postCount: 0 }));

  const users = await Promise.all(USER_SEED.map(async (u, i) => {
    const passwordSalt = await randomToken(16);
    const passwordHash = await hashPassword(DEMO_PASSWORD, passwordSalt);
    return {
      _id: genId(),
      ...u,
      collegeEmail: `${u.name.toLowerCase().replace(/\s+/g, '.')}@campuspulse.edu`,
      passwordHash,
      passwordSalt,
      profileImage: `https://i.pravatar.cc/300?img=${i + 1}`,
      bio: 'Student at CampusPulse, always happy to help or learn something new.',
      skills: pickSome(['React Native', 'DSA', 'Java', 'Public Speaking', 'Photography', 'Guitar', 'Photoshop', 'Excel', 'Python', 'Spanish'], 4),
      availability: pickSome(['Weekday Mornings', 'Weekday Evenings', 'Weekends', 'Flexible / Anytime'], 2),
      rating: 0,
      ratingCount: 0,
      isOnline: i % 3 !== 0,
    };
  }));

  const posts = POST_SEED.map((p, i) => {
    const author = users[i % users.length];
    const likedBy = pickSome(users.filter((u) => u._id !== author._id), Math.floor(Math.random() * 6));
    const bookmarkedBy = pickSome(users.filter((u) => u._id !== author._id), Math.floor(Math.random() * 3));
    return {
      _id: genId(),
      user: author._id,
      type: p.type,
      title: p.title,
      description: DESCRIPTIONS[p.type],
      category: p.category,
      compensationType: p.compensationType,
      compensationAmount: p.compensationAmount,
      images: i % 3 === 0 ? [`https://picsum.photos/seed/campuspulse-seed-${i}/800/500`] : [],
      location: pick(LOCATIONS),
      likedBy: likedBy.map((u) => u._id),
      likesCount: likedBy.length,
      bookmarkedBy: bookmarkedBy.map((u) => u._id),
      status: 'active',
      createdAt: daysAgo(i % 10),
    };
  });

  categories.forEach((c) => {
    c.postCount = posts.filter((p) => p.category === c.name).length;
  });

  const conversations = [];
  const messages = [];
  const chatPairs = [
    [users[0], users[2]],
    [users[0], users[4]],
    [users[3], users[5]],
    [users[1], users[7]],
  ];
  for (const [a, b] of chatPairs) {
    const conversationId = genId();
    const texts = [
      [b, 'Hey! Saw your post, can you help me out?'],
      [a, 'Hi! Yes, happy to help. What do you need?'],
      [b, 'Just need some guidance, are you free this week?'],
      [a, 'Sure, that works for me!'],
    ];
    texts.forEach(([sender, text], idx) => {
      messages.push({ _id: genId(), conversation: conversationId, sender: sender._id, text, createdAt: daysAgo(0.2 - idx * 0.01) });
    });
    conversations.push({
      _id: conversationId,
      participants: [a._id, b._id],
      lastMessage: 'Sure, that works for me!',
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [a._id]: 0, [b._id]: Math.floor(Math.random() * 3) },
    });
  }

  const bookings = [];
  const bookingSeeds = [
    { status: 'upcoming', count: 2 },
    { status: 'completed', count: 3 },
    { status: 'cancelled', count: 1 },
  ];
  let postCursor = 0;
  for (const { status, count } of bookingSeeds) {
    for (let i = 0; i < count; i += 1) {
      const post = posts[postCursor % posts.length];
      postCursor += 1;
      const requester = pick(users.filter((u) => u._id !== post.user));
      bookings.push({
        _id: genId(),
        post: post._id,
        requester: requester._id,
        provider: post.user,
        status,
        // Upcoming bookings get a future date, completed/cancelled ones a past date.
        scheduledDate: status === 'upcoming' ? daysAgo(-1 * (1 + Math.floor(Math.random() * 6))) : daysAgo(1 + Math.floor(Math.random() * 14)),
        createdAt: daysAgo(Math.floor(Math.random() * 14)),
      });
    }
  }

  const reviews = [];
  const comments = [
    'Explained things so clearly, really helped me out!',
    'Super punctual and patient. Highly recommend.',
    'Great session overall, would book again.',
  ];
  bookings.filter((b) => b.status === 'completed').forEach((booking) => {
    const rating = 4 + Math.round(Math.random());
    reviews.push({ _id: genId(), booking: booking._id, fromUser: booking.requester, toUser: booking.provider, rating, comment: pick(comments), createdAt: daysAgo(2) });
    const provider = users.find((u) => u._id === booking.provider);
    if (provider) {
      const newCount = provider.ratingCount + 1;
      provider.rating = Math.round(((provider.rating * provider.ratingCount + rating) / newCount) * 10) / 10;
      provider.ratingCount = newCount;
    }
  });

  const notifications = [];
  const notificationTemplates = [
    { type: 'booking_accepted', title: 'Booking Accepted', body: 'Your tutoring request was accepted.' },
    { type: 'new_message', title: 'New Message', body: 'You have a new message waiting.' },
    { type: 'new_request', title: 'New Request', body: 'Someone wants to book your post.' },
    { type: 'profile_viewed', title: 'Profile Viewed', body: 'Your profile was viewed recently.' },
  ];
  users.slice(0, 6).forEach((seedUser) => {
    pickSome(notificationTemplates, 3).forEach((template) => {
      notifications.push({
        _id: genId(),
        user: seedUser._id,
        ...template,
        isRead: Math.random() > 0.5,
        createdAt: daysAgo(Math.floor(Math.random() * 5)),
      });
    });
  });

  return { users, categories, posts, conversations, messages, notifications, bookings, reviews, sessions: [] };
};

const load = async () => {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const seeded = await AsyncStorage.getItem(SEED_FLAG_KEY);
    if (!seeded) {
      const seed = await buildSeed();
      await AsyncStorage.multiSet(COLLECTIONS.map((key) => [`${STORAGE_PREFIX}${key}`, JSON.stringify(seed[key])]));
      await AsyncStorage.setItem(SEED_FLAG_KEY, '1');
      cache = seed;
      return cache;
    }

    const pairs = await AsyncStorage.multiGet(COLLECTIONS.map((key) => `${STORAGE_PREFIX}${key}`));
    cache = {};
    pairs.forEach(([storageKey, value], i) => {
      cache[COLLECTIONS[i]] = value ? JSON.parse(value) : [];
    });
    return cache;
  })();

  return loadPromise;
};

const persist = async (name) => {
  await AsyncStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(cache[name]));
};

// Public API -----------------------------------------------------------------

export const ready = () => load();

export const getAll = async (name) => {
  await load();
  return cache[name];
};

// Every mutation below is chained onto this queue instead of running as soon as it's called. Even
// though JS is single-threaded, `await load()` yields a microtask tick *even when the cache is
// already warm* (load() is always async), so two callers that each do a read-then-write against
// the same record (e.g. two rapid toggleLike taps, both computing `liked` from the same snapshot)
// can otherwise interleave and one write silently clobbers the other. Routing every mutation
// through this chain guarantees each one's read + compute + persist runs to completion before the
// next one starts.
let writeChain = Promise.resolve();
const enqueueWrite = (task) => {
  const result = writeChain.then(task, task);
  writeChain = result.then(() => {}, () => {});
  return result;
};

export const insert = (name, doc) => enqueueWrite(async () => {
  await load();
  const record = { _id: genId(), createdAt: new Date().toISOString(), ...doc };
  cache[name].push(record);
  await persist(name);
  return record;
});

// Like insert(), but for "reject if a duplicate already exists" flows (unique email on register,
// one upcoming booking per post, one review per booking, ...). `factory` receives the collection's
// current, queue-fresh array and must return the doc to insert — or throw to reject. Running the
// existence check *and* the insert inside the same exclusive task closes the race where two
// concurrent calls both check against the same pre-insert snapshot and both pass.
export const insertWith = (name, factory) => enqueueWrite(async () => {
  await load();
  const doc = factory(cache[name]);
  const record = { _id: genId(), createdAt: new Date().toISOString(), ...doc };
  cache[name].push(record);
  await persist(name);
  return record;
});

// For "find the existing one, or create it" flows (Google login's implicit account creation,
// starting a conversation between two users, ...). Doing the find and the maybe-insert inside one
// exclusive task closes the race where two concurrent calls both miss the same not-yet-inserted
// record and each create their own duplicate.
export const findOrCreate = (name, predicate, factory) => enqueueWrite(async () => {
  await load();
  const existing = cache[name].find(predicate);
  if (existing) return existing;
  const record = { _id: genId(), createdAt: new Date().toISOString(), ...factory() };
  cache[name].push(record);
  await persist(name);
  return record;
});

export const update = (name, id, patch) => enqueueWrite(async () => {
  await load();
  const idx = cache[name].findIndex((r) => r._id === id);
  if (idx === -1) return null;
  cache[name][idx] = { ...cache[name][idx], ...patch };
  await persist(name);
  return cache[name][idx];
});

// Like update(), but the patch is computed from the current record *inside* the exclusive section
// instead of by the caller beforehand — needed for read-modify-write logic like toggling a like,
// where the caller can't safely precompute the patch without risking exactly the race described
// above.
export const updateWith = (name, id, updater) => enqueueWrite(async () => {
  await load();
  const idx = cache[name].findIndex((r) => r._id === id);
  if (idx === -1) return null;
  cache[name][idx] = { ...cache[name][idx], ...updater(cache[name][idx]) };
  await persist(name);
  return cache[name][idx];
});

export const remove = (name, id) => enqueueWrite(async () => {
  await load();
  cache[name] = cache[name].filter((r) => r._id !== id);
  await persist(name);
});

export const findById = async (name, id) => {
  await load();
  return cache[name].find((r) => r._id === id) || null;
};

export const setCollection = (name, records) => enqueueWrite(async () => {
  await load();
  cache[name] = records;
  await persist(name);
});

export const genLocalId = genId;

// Resets everything back to the original seed (handy while developing, not wired to any screen).
export const resetToSeed = async () => {
  await AsyncStorage.removeItem(SEED_FLAG_KEY);
  cache = null;
  loadPromise = null;
  await load();
};
