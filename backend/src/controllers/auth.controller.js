const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model"); // Changed from UserModel
const config = require("../config");

class AuthController {
  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { npk, password } = req.body;

      // Validation
      if (!npk || !password) {
        return res.status(400).json({
          success: false,
          message: "NPK dan password harus diisi",
        });
      }

      // Find user by NPK
      const user = await User.findOne({ where: { npk } }); // Using Sequelize findOne
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "NPK atau password salah",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "NPK atau password salah",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          npk: user.npk,
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
            id: user.id,
            npk: user.npk,
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);
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
      const user = await User.findByPk(req.user.id); // Using Sequelize findByPk
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
            id: user.id,
            npk: user.npk,
            created_at: user.created_at,
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
      const user = await User.findByPk(req.user.id); // Using Sequelize findByPk
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Password lama salah",
        });
      }

      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await user.update({ password_hash: newPasswordHash }); // Using Sequelize update

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


