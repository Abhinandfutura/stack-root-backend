const express = require("express");
const router = express.Router();

const {
  signup,
  signin,
  verifyToken,
  logout,
} = require("../Controller/User-controller");
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", verifyToken, logout);

module.exports = router;
