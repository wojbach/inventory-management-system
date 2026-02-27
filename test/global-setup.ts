import { MongoMemoryReplSet } from 'mongodb-memory-server';

export default async function globalSetup() {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: {
      version: '8.0.4',
      os: { os: 'linux', dist: 'ubuntu', release: '22.04' },
    },
  });

  process.env.MONGO_URI = replSet.getUri();

  global.__MONGOINSTANCE = replSet;
}
