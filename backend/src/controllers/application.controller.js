const ApplicationModel = require("../models/application.model");
const { generateAppToken } = require("../utils/token.generator");

class ApplicationController {
  /**
   * Create new application
   */
  static async create(req, res) {
    try {
      const { name, description } = req.body;

      // Validation
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Nama aplikasi harus diisi",
        });
      }

      if (name.length > 150) {
        return res.status(400).json({
          success: false,
          message: "Nama aplikasi maksimal 150 karakter",
        });
      }

      // Generate unique token
      const appToken = generateAppToken();

      // Create application
      const newApp = await ApplicationModel.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        app_token: appToken,
      });

      res.status(201).json({
        success: true,
        message: "Aplikasi berhasil dibuat",
        data: {
          application: newApp,
        },
      });
    } catch (error) {
      console.error("Create application error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Get all applications
   */
  static async getAll(req, res) {
    try {
      const applications = await ApplicationModel.getAll();

      res.json({
        success: true,
        data: {
          applications,
        },
      });
    } catch (error) {
      console.error("Get all applications error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Get application by ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const application = await ApplicationModel.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Aplikasi tidak ditemukan",
        });
      }

      res.json({
        success: true,
        data: {
          application,
        },
      });
    } catch (error) {
      console.error("Get application by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Update application
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validation
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Nama aplikasi harus diisi",
        });
      }

      if (name.length > 150) {
        return res.status(400).json({
          success: false,
          message: "Nama aplikasi maksimal 150 karakter",
        });
      }

      // Check if application exists
      const existingApp = await ApplicationModel.findById(id);
      if (!existingApp) {
        return res.status(404).json({
          success: false,
          message: "Aplikasi tidak ditemukan",
        });
      }

      // Update application
      const updated = await ApplicationModel.update(id, {
        name: name.trim(),
        description: description ? description.trim() : null,
      });

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada perubahan data",
        });
      }

      res.json({
        success: true,
        message: "Aplikasi berhasil diperbarui",
      });
    } catch (error) {
      console.error("Update application error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Delete application
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if application exists
      const existingApp = await ApplicationModel.findById(id);
      if (!existingApp) {
        return res.status(404).json({
          success: false,
          message: "Aplikasi tidak ditemukan",
        });
      }

      // Delete application
      const deleted = await ApplicationModel.delete(id);
      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: "Gagal menghapus aplikasi",
        });
      }

      res.json({
        success: true,
        message: "Aplikasi berhasil dihapus",
      });
    } catch (error) {
      console.error("Delete application error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  /**
   * Regenerate application token
   */
  static async regenerateToken(req, res) {
    try {
      const { id } = req.params;

      // Check if application exists
      const existingApp = await ApplicationModel.findById(id);
      if (!existingApp) {
        return res.status(404).json({
          success: false,
          message: "Aplikasi tidak ditemukan",
        });
      }

      // Generate new token
      const newToken = generateAppToken();

      // Update application with new token
      const updated = await ApplicationModel.update(id, {
        app_token: newToken,
      });

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Gagal memperbarui token",
        });
      }

      res.json({
        success: true,
        message: "Token berhasil diperbarui",
        data: {
          app_token: newToken,
        },
      });
    } catch (error) {
      console.error("Regenerate token error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }
}

module.exports = ApplicationController;
