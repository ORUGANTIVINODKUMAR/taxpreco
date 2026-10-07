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

module.exports = router;
