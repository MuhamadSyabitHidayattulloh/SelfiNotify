const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Application = require("./application.model");

const NotificationHistory = sequelize.define("NotificationHistory", {
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
  status: {
    type: DataTypes.STRING(50),
    defaultValue: "SENT",
  },
  sent_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "notification_history",
  timestamps: false,
});

NotificationHistory.belongsTo(Application, { foreignKey: "application_id" });
Application.hasMany(NotificationHistory, { foreignKey: "application_id" });

module.exports = NotificationHistory;

