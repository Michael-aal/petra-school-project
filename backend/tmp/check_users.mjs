import '../config/loadEnv.js';
import pg from 'pg';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  const res = await client.query('SELECT "id", "email", "role", "schoolId", "selectedSchoolId", "fullName" FROM public."User" LIMIT 20');
  console.log(JSON.stringify(res.rows, null, 2));
} finally {
  await client.end();
}
