const express = require("express");
const cors = require("cors");
require("dotenv").config();
const contextRoutes = require("./routes/context");
const toolsRoutes = require("./routes/tools");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", contextRoutes);
app.use("/api/tools", toolsRoutes);
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "tools-api",
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Tools API running on port ${PORT}`);
});