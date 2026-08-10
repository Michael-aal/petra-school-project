import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const client = new PrismaClient({ adapter });
console.log('client $use', typeof client.$use);
console.log('client $extends', typeof client.$extends);

try {
  const extended = client.$extends({
    query: {
      before: (args, client) => {
        console.log('middleware before', args.model, args.action);
        return args;
      },
      after: (result) => {
        console.log('middleware after');
        return result;
      },
    },
  });
  console.log('extended created', typeof extended.$use, typeof extended.$extends);
  await extended.user.findMany({ take: 1 });
  console.log('findMany succeeded');
} catch (err) {
  console.error('probe error', err && err.message ? err.message : err);
}
