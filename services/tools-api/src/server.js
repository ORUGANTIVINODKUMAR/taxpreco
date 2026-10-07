const express = require("express");
const { initializeDatabase } = require("./db/init");
const cors = require("cors");
const mutualFundRoutes = require("./routes/mutualFund");
require("dotenv").config();
const contextRoutes = require("./routes/context");
const toolsRoutes = require("./routes/tools");
const app = express();
const { testConnection } = require("./db");
app.use(cors());
app.use(express.json());
app.use("/api", contextRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/mutual-fund", mutualFundRoutes);
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "tools-api",
  });
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "taxpreco-tools",
  });
});
initializeDatabase()
  .then(() => {
    console.log("Database initialization complete");
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
  });
const PORT = process.env.PORT || 4000;
testConnection().catch((error) => {
  console.error("PostgreSQL connection failed:", error);
});
app.listen(PORT, () => {
  console.log(`Tools API running on port ${PORT}`);
});