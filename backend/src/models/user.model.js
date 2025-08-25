const { DataTypes } = require("sequelize");
const { masterSequelize } = require("../config/database");

const User = masterSequelize.define(
  "User",
  {
    username: {
      type: DataTypes.CHAR(10),
      primaryKey: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(2000),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
  },
  {
    tableName: "master_login",
    timestamps: false,
  }
);

module.exports = User;
