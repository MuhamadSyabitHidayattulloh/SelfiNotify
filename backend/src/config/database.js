const { Sequelize } = require("sequelize");
require("dotenv").config();

// Database utama SelfiNotify
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mssql",
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate:
          process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
      },
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Database master untuk auth
const masterSequelize = new Sequelize(
  process.env.MASTER_DB_NAME,
  process.env.MASTER_DB_USER,
  process.env.MASTER_DB_PASSWORD,
  {
    host: process.env.MASTER_DB_HOST,
    dialect: "mssql",
    dialectOptions: {
      options: {
        encrypt: process.env.MASTER_DB_ENCRYPT === "true",
        trustServerCertificate:
          process.env.MASTER_DB_TRUST_SERVER_CERTIFICATE === "true",
      },
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "Connection to SelfiNotify database has been established successfully."
    );

    await masterSequelize.authenticate();
    console.log(
      "Connection to Master database has been established successfully."
    );
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = { sequelize, masterSequelize, connectDB };
