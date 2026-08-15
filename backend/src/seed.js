// Populates a fresh database with the same demo data the local-only build used to
// self-seed, so you have something to test against immediately.
// Run with: npm run seed   (needs backend/.env with MONGODB_URI set first)

require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Post = require('./models/Post');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

const DEMO_PASSWORD = 'password123';

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
];

const POST_SEED = [
  { type: 'need', title: 'Need Scientific Calculator', category: 'Math', compensationType: 'free' },
  { type: 'offer', title: 'Offering C Programming Tutoring', category: 'Programming', compensationType: 'paid', compensationAmount: 200 },
  { type: 'need', title: 'Need Assignment Help in DBMS', category: 'Tutoring', compensationType: 'exchange' },
  { type: 'offer', title: 'Offering Guitar Classes', category: 'Music', compensationType: 'paid', compensationAmount: 300 },
];

const run = async () => {
  await connectDB();

  await Promise.all([User.deleteMany({}), Category.deleteMany({}), Post.deleteMany({}), Conversation.deleteMany({}), Message.deleteMany({})]);

  const categories = await Category.insertMany(CATEGORY_SEED);

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = await User.insertMany(
    USER_SEED.map((u, i) => ({
      ...u,
      collegeEmail: `${u.name.toLowerCase().replace(/\s+/g, '.')}@campuspulse.edu`,
      password: hashed,
      profileImage: `https://i.pravatar.cc/300?img=${i + 1}`,
      bio: 'Student at CampusPulse, always happy to help or learn something new.',
      skills: ['React Native', 'DSA'],
      availability: ['Weekday Evenings'],
      isOnline: false,
    }))
  );

  const posts = await Post.insertMany(
    POST_SEED.map((p, i) => ({ ...p, user: users[i % users.length]._id, description: 'Message me to work out timing and specifics.' }))
  );

  for (const cat of categories) {
    cat.postCount = posts.filter((p) => p.category === cat.name).length;
    await cat.save();
  }

  console.log(`Seeded ${users.length} users, ${categories.length} categories, ${posts.length} posts.`);
  console.log(`Demo login: ${users[0].collegeEmail} / ${DEMO_PASSWORD}`);
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed] failed:', err.message);
  process.exit(1);
});
