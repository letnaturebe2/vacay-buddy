import { testDataSource } from "./test-db";

beforeAll(async () => {
  await testDataSource.initialize();
});

afterAll(async () => {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
});