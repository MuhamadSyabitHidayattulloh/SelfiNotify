const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const config = require("../config");
const logger = require("../utils/logger");

class AuthController {
  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username dan password harus diisi",
        });
      }

      // Find user by username
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Username atau password salah",
        });
      }

      // Hash password input with MD5
      const hashedPassword = crypto
        .createHash("md5")
        .update(password)
        .digest("hex");

      // Verify password
      if (user.password !== hashedPassword) {
        return res.status(401).json({
          success: false,
          message: "Username atau password salah",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          username: user.username,
          name: user.name,
        },
        config.jwtSecret,
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        message: "Login berhasil",
        data: {
          token,
          user: {
            username: user.username,
            name: user.name,
          },
        },
      });
    } catch (error) {
      logger.error("Login error", error, "AuthController.login");
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      const user = await User.findOne({
        where: { username: req.user.username },
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            username: user.username,
            name: user.name,
          },
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Password lama dan password baru harus diisi",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password baru minimal 6 karakter",
        });
      }

      // Get current user
      const user = await User.findOne({
        where: { username: req.user.username },
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      // Hash current password with MD5
      const hashedCurrentPassword = crypto
        .createHash("md5")
        .update(currentPassword)
        .digest("hex");

      // Verify current password
      if (user.password !== hashedCurrentPassword) {
        return res.status(401).json({
          success: false,
          message: "Password lama salah",
        });
      }

      // Hash new password with MD5
      const hashedNewPassword = crypto
        .createHash("md5")
        .update(newPassword)
        .digest("hex");

      // Update password
      await user.update({
        password: hashedNewPassword,
      });

      res.json({
        success: true,
        message: "Password berhasil diubah",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }
}

module.exports = AuthController;
