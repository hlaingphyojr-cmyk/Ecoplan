require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: npm run make-admin -- <email>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecoplan');
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error('No user found with email:', email);
    process.exit(1);
  }
  user.role = 'admin';
  await user.save();
  console.log(`Promoted ${user.name} (${user.email}) to admin.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});