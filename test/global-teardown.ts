import { MongoMemoryReplSet } from 'mongodb-memory-server';

export default async function globalTeardown() {
  const instance = global.__MONGOINSTANCE as MongoMemoryReplSet;
  if (instance) {
    await instance.stop();
  }
}
