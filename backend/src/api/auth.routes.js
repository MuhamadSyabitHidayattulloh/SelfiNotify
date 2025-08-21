const express = require("express");
const AuthController = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Login user dengan NPK dan password
 * @access Public
 */
router.post("/login", AuthController.login);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get("/profile", verifyToken, AuthController.getProfile);

/**
 * @route PUT /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.put("/change-password", verifyToken, AuthController.changePassword);

module.exports = router;
