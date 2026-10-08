const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { attachContext } = require("../middleware/context");

function createContextRouter(auth = requireAuth, context = attachContext) {
const router = express.Router();

router.get("/context", auth, context, (req, res) => {
  res.json({
    ok: true,
    context: req.context,
  });
});

router.get("/me", auth, context, (req, res) => {
  res.json({
    authenticated: true,
    mode: "firebase",
    user: {
      id: req.context.userId,
      firebaseUid: req.context.firebaseUid,
      email: req.localUser.email,
      name: req.localUser.display_name || req.localUser.email || "Tapreco User",
    },
  });
});

return router;
}
module.exports = { createContextRouter };
