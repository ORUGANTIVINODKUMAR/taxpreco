function attachContext(req, res, next) {
  req.context = {
    userId: req.user?.sub || req.user?.userId || null,
    clientId: req.user?.clientId || null,
    email: req.user?.email || null,
  };

  next();
}

module.exports = {
  attachContext,
};
