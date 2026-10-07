const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { attachContext } = require("../middleware/context");

const router = express.Router();

const allowedTools = new Set([
  "entity-comparison",
  "mutual-fund",
  "estimated-tax",
  "audit-risk",
]);
router.get("/", (req, res) => {
  res.json([
    {
      id: "entity-comparison",
      name: "Entity Comparison",
      description: "Compare entity assumptions and tax scenarios.",
      enabled: true,
      availability: "demo",
    },
    {
      id: "mutual-fund",
      name: "Mutual Fund",
      description: "Review mutual fund planning scenarios.",
      enabled: true,
      availability: "demo",
    },
    {
      id: "estimated-tax",
      name: "Estimated Tax",
      description: "Estimate federal tax planning scenarios.",
      enabled: true,
      availability: "demo",
    },
    {
      id: "audit-risk",
      name: "Audit Risk Analyzer",
      description: "Review potential audit-risk factors.",
      enabled: true,
      availability: "demo",
    },
  ]);
});
router.use(requireAuth);
router.use(attachContext);

router.get("/:toolName/status", (req, res) => {
  const { toolName } = req.params;

  if (!allowedTools.has(toolName)) {
    return res.status(404).json({
      error: "Unknown tool",
    });
  }

  res.json({
    ok: true,
    tool: toolName,
    context: req.context,
  });
});

module.exports = router;