require("dotenv").config();
const { createApp } = require("./app");
const { firebaseAuth } = require("./firebase");
const { initializeDatabase } = require("./db/init");
const { testConnection } = require("./db");
try {
firebaseAuth();
const app = createApp();
initializeDatabase()
  .then(() => {
    console.log("Database initialization complete");
  })
  .catch((error) => {
    console.error("Database initialization failed.");
  });
const PORT = process.env.PORT || 4000;
testConnection().catch((error) => {
  console.error("PostgreSQL connection failed.");
});
app.listen(PORT, () => {
  console.log(`Tools API running on port ${PORT}`);
});
} catch {
  console.error("Tools API startup failed. Check Firebase project, credential format and CORS configuration.");
  process.exitCode = 1;
}
