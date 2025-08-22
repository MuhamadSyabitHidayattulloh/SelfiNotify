const { sequelize } = require("../src/config/database");
const User = require("../src/models/user.model");
const Application = require("../src/models/application.model");
const NotificationHistory = require("../src/models/notification.model");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  try {
    // Sync all models with the database
    // `force: true` will drop the table if it already exists
    await sequelize.sync({ force: true });
    console.log("All models were synchronized successfully.");

    // Create a default user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      npk: "admin",
      password_hash: hashedPassword,
    });
    console.log("Default admin user created.");

    // Create a default application
    await Application.create({
      name: "SelfiNotify Web App",
      description: "Default application for SelfiNotify web interface",
      platform: "website",
      app_token: "web-app-token-123", // You might want to generate this dynamically
    });
    console.log("Default web application created.");

    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();
