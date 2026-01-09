import { beforeAll, afterAll, afterEach } from "vitest";

// Setup runs before all tests
beforeAll(async () => {
  console.log("Test setup: Starting...");
});

// Cleanup after each test
afterEach(async () => {
  // Reset any mocks or state between tests
});

// Teardown after all tests
afterAll(async () => {
  console.log("Test teardown: Complete");
});
