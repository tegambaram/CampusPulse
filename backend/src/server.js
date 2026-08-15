require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const attachSocket = require('./sockets');
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const notificationRoutes = require('./routes/notifications');
const postRoutes = require('./routes/posts');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*' ? process.env.CORS_ORIGIN.split(',') : '*';

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '5mb' })); // generous limit: image picker can send sizeable data URIs

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/search', searchRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our end.' });
});

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = attachSocket(server, corsOrigin);
  app.set('io', io); // so REST routes (bookings, conversations) can also emit live socket events

  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log(`[server] listening on port ${port}`));
};

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});
