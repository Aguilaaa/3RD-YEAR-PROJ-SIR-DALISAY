require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/User');

async function makeAdmin() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run make-admin -- you@email.com');
    process.exit(1);
  }

  await connectDB();
  const user = await User.findOne({ email });
  if (!user) {
    console.error('No MotoTech profile uses that email yet. Register in the app first.');
    process.exit(1);
  }

  user.role = 'admin';
  user.status = 'active';
  await user.save();
  console.log(`${user.email} is now an admin.`);
  await mongoose.disconnect();
}

makeAdmin().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
