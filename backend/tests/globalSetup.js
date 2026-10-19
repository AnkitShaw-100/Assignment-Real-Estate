import { MongoMemoryServer } from 'mongodb-memory-server';

// One in-memory MongoDB for the whole run; each test file uses its own database.
// Starting an instance per file is slow and flaky on Windows.
let mongo;

export async function setup({ provide }) {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  provide('mongoUri', mongo.getUri());
}

export async function teardown() {
  await mongo?.stop();
}
