// End-to-end regression check — boots the real server against your real MONGODB_URI (from
// backend/.env) and exercises the exact reply + notification flow the frontend depends on.
// Run any time after setting up .env with: node smoketest.js
// Uses throwaway seeded accounts (alice-smoketest@..., bob-smoketest@...) and deletes them
// (plus their conversation/messages/notifications) before and after — safe to re-run against
// your real dev database.
require('dotenv').config();
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set — copy backend/.env.example to backend/.env and fill it in first.');
  process.exit(1);
}
const PORT = process.env.PORT || 4123;
process.env.PORT = String(PORT);

const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const { io: ioClient } = require('socket.io-client');

const ALICE_EMAIL = 'alice-smoketest@campuspulse.edu';
const BOB_EMAIL = 'bob-smoketest@campuspulse.edu';

const request = (method, path, body, token) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      { hostname: 'localhost', port: PORT, path, method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } },
      (res) => {
        let chunks = '';
        res.on('data', (c) => (chunks += c));
        res.on('end', () => resolve({ status: res.statusCode, body: chunks ? JSON.parse(chunks) : null }));
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });

const wipeTestData = async () => {
  const User = require('./src/models/User');
  const Conversation = require('./src/models/Conversation');
  const Message = require('./src/models/Message');
  const Notification = require('./src/models/Notification');

  const users = await User.find({ collegeEmail: { $in: [ALICE_EMAIL, BOB_EMAIL] } });
  const ids = users.map((u) => u._id);
  if (ids.length === 0) return;

  const conversations = await Conversation.find({ participants: { $in: ids } });
  const convIds = conversations.map((c) => c._id);
  await Promise.all([
    Message.deleteMany({ conversation: { $in: convIds } }),
    Conversation.deleteMany({ _id: { $in: convIds } }),
    Notification.deleteMany({ user: { $in: ids } }),
    User.deleteMany({ _id: { $in: ids } }),
  ]);
};

const waitForMongoConnection = async (timeoutMs = 20000) => {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - start > timeoutMs) throw new Error('Timed out waiting for MongoDB connection — check MONGODB_URI/network access.');
    await new Promise((r) => setTimeout(r, 200));
  }
};

const run = async () => {
  // Import after env vars are set, since server.js reads them at require-time.
  require('./src/server.js');
  await waitForMongoConnection();
  await new Promise((r) => setTimeout(r, 300)); // let the HTTP server finish binding the port

  await wipeTestData(); // clean slate in case a previous run crashed before cleanup

  console.log('1. Registering two users (Alice, Bob)...');
  const alice = await request('POST', '/api/auth/register', {
    name: 'Alice', collegeEmail: ALICE_EMAIL, department: 'CS', semester: '3rd', password: 'password123',
  });
  assert.strictEqual(alice.status, 200, `register alice failed: ${JSON.stringify(alice.body)}`);
  const bob = await request('POST', '/api/auth/register', {
    name: 'Bob', collegeEmail: BOB_EMAIL, department: 'CS', semester: '3rd', password: 'password123',
  });
  assert.strictEqual(bob.status, 200, `register bob failed: ${JSON.stringify(bob.body)}`);
  console.log('   OK — got JWTs for both.');

  console.log('2. Alice starts a conversation with Bob...');
  const conv = await request('POST', '/api/conversations', { userId: bob.body.user._id }, alice.body.token);
  assert.strictEqual(conv.status, 200, `start conversation failed: ${JSON.stringify(conv.body)}`);
  const conversationId = conv.body.id;
  console.log('   OK — conversation id:', conversationId);

  console.log('3. Both connect over Socket.io, Bob joins the conversation room + listens...');
  const aliceSocket = ioClient(`http://localhost:${PORT}`, { auth: { token: alice.body.token }, transports: ['websocket'] });
  const bobSocket = ioClient(`http://localhost:${PORT}`, { auth: { token: bob.body.token }, transports: ['websocket'] });
  await Promise.all([
    new Promise((r) => aliceSocket.on('connect', r)),
    new Promise((r) => bobSocket.on('connect', r)),
  ]);
  bobSocket.emit('join_conversation', conversationId);
  await new Promise((r) => setTimeout(r, 200));

  const receivedMessage = new Promise((r) => bobSocket.once('receive_message', r));
  const receivedNotification = new Promise((r) => bobSocket.once('notification', r));

  console.log('4. Alice sends "Hey Bob, need help with DBMS!" via the socket (the real reply flow)...');
  aliceSocket.emit('send_message', { conversationId, text: 'Hey Bob, need help with DBMS!' });

  const [msg, notif] = await Promise.all([receivedMessage, receivedNotification]);
  assert.strictEqual(msg.text, 'Hey Bob, need help with DBMS!');
  assert.strictEqual(notif.type, 'new_message');
  assert.strictEqual(notif.title, 'Alice');
  console.log('   OK — Bob received the message live AND a notification, in real time.');

  console.log('5. Bob checks unread count + notifications over REST...');
  const convList = await request('GET', '/api/conversations', null, bob.body.token);
  assert.strictEqual(convList.body[0].unreadCount, 1, `expected unread 1, got ${JSON.stringify(convList.body)}`);
  const notifList = await request('GET', '/api/notifications', null, bob.body.token);
  assert.strictEqual(notifList.body.data.length, 1);
  console.log('   OK — persisted correctly.');

  console.log('6. Bob replies back to Alice...');
  const receivedReply = new Promise((r) => aliceSocket.once('receive_message', r));
  bobSocket.emit('send_message', { conversationId, text: 'Sure, what do you need?' });
  const reply = await receivedReply;
  assert.strictEqual(reply.text, 'Sure, what do you need?');
  console.log('   OK — Alice received Bob\'s reply live.');

  aliceSocket.disconnect();
  bobSocket.disconnect();
  await wipeTestData();
  await mongoose.disconnect();
  console.log('\nALL SMOKE TESTS PASSED — reply + notification flow works end-to-end.');
  process.exit(0);
};

run().catch(async (err) => {
  console.error('\nSMOKE TEST FAILED:', err);
  try {
    await wipeTestData();
  } catch (cleanupErr) {
    console.error('(cleanup also failed:', cleanupErr.message, ')');
  }
  process.exit(1);
});
