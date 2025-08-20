const bcrypt = require('bcryptjs');
const database = require('../src/config/database');
const UserModel = require('../src/models/user.model');

async function seedDatabase() {
    try {
        // Connect to database
        await database.connect();
        console.log('Connected to database');

        // Create default admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        try {
            await UserModel.create({
                npk: 'admin',
                password_hash: adminPassword,
                role: 'admin'
            });
            console.log('✅ Default admin user created (NPK: admin, Password: admin123)');
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                console.log('ℹ️  Admin user already exists');
            } else {
                throw error;
            }
        }

        // Create default regular user
        const userPassword = await bcrypt.hash('user123', 10);
        
        try {
            await UserModel.create({
                npk: 'user001',
                password_hash: userPassword,
                role: 'user'
            });
            console.log('✅ Default user created (NPK: user001, Password: user123)');
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                console.log('ℹ️  User already exists');
            } else {
                throw error;
            }
        }

        console.log('🎉 Database seeding completed');
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await database.close();
        process.exit(0);
    }
}

seedDatabase();

