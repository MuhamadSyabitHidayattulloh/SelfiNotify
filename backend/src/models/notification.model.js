const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Application = require("./application.model");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Application,
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "notifications",
    timestamps: false,
  }
);

Notification.belongsTo(Application, { foreignKey: "application_id" });
Application.hasMany(Notification, { foreignKey: "application_id" });

module.exports = Notification;
