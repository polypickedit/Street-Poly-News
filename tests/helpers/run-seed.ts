import { seedTestFixture } from "./seed";

seedTestFixture()
  .then((fixture) => {
    console.log("Seeded test fixture:", {
      submissionId: fixture.submissionId,
      normal: fixture.normal.email,
      admin: fixture.admin.email,
    });
  })
  .catch((error) => {
    console.error("Failed to seed test data", error);
    process.exit(1);
  });
