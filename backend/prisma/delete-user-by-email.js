import "../config/loadEnv.js";
import { connectDB, disconnectDB } from '../config/db.js';
import { userModel } from '../models/userModel.js';

const email = process.argv[2] || process.env.TARGET_EMAIL;

if (!email) {
  console.error('Usage: node prisma/delete-user-by-email.js <email>');
  process.exit(1);
}

const main = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');
    const user = await (await import('../models/userModel.js')).userModel.findByEmail(email);
    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }
    console.log('Found user:', { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt });
    await userModel.deleteAccount(user.id);
    console.log(`User ${email} (id: ${user.id}) deleted successfully`);
  } catch (err) {
    console.error('Error deleting user:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

main();
