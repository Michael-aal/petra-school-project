const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://nuvora:NuvoraTest123@127.0.0.1:5432/nuvora_db';
const client = new Client({ connectionString });

(async () => {
  try {
    await client.connect();
    await client.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "selectedSchoolId" INTEGER;');
    await client.query(`DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'User_selectedSchoolId_fkey'
        ) THEN
          ALTER TABLE "User"
            ADD CONSTRAINT "User_selectedSchoolId_fkey"
            FOREIGN KEY ("selectedSchoolId") REFERENCES "School"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;`);
    await client.query('CREATE INDEX IF NOT EXISTS "User_selectedSchoolId_idx" ON "User"("selectedSchoolId");');

    const result = await client.query('SELECT "id", "email", "role", "schoolId", "selectedSchoolId", "fullName" FROM public."User" LIMIT 20');
    console.log(JSON.stringify(result.rows, null, 2));
    console.log('selectedSchoolId schema ensured');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
