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