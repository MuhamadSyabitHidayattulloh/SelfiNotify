const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Application = sequelize.define("Application", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  platform: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  app_token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "applications",
  timestamps: false,
});

module.exports = Application;
