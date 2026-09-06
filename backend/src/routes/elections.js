// LEGACY / INACTIVE ROUTE TREE
// The active backend routes live under ../routes and are mounted by ../app.js.
// This legacy file intentionally exports no Express routes so it cannot register
// stale handlers that are incompatible with the active controller architecture.
module.exports = require("express").Router();
