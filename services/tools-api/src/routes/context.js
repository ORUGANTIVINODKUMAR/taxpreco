const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { attachContext } = require("../middleware/context");

const router = express.Router();

router.get("/context", requireAuth, attachContext, (req, res) => {
  res.json({
    ok: true,
    context: req.context,
  });
});

router.get("/me", requireAuth, attachContext, (req, res) => {
  res.json({
    authenticated: true,
    mode: "jwt",
    user: {
      id: req.context.userId,
      name: req.user?.name || req.context.email || "Tapreco User",
      role: req.user?.role || "user",
    },
  });
});

module.exports = router;