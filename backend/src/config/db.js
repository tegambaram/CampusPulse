const mongoose = require('mongoose');
const dns = require('dns');

// Some local/ISP DNS resolvers refuse MongoDB Atlas SRV lookups during
// development. Only override DNS when explicitly requested (e.g. locally
// via .env), so production hosts (Render etc.) use their normal resolver.
if (process.env.FORCE_DNS_SERVER) {
  dns.setServers([process.env.FORCE_DNS_SERVER]);
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy backend/.env.example to backend/.env and fill it in.'
    );
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);

  console.log('[db] connected to MongoDB');
};

module.exports = connectDB;