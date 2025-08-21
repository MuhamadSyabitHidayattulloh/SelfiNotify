const bcrypt = require('bcryptjs');
const database = require('../src/config/database');
const UserModel = require('../src/models/user.model');

async function seedDatabase() {
    try {
        // Connect to database
        await database.connect();
        console.log('Connected to database');

        // Create default user
        const userPassword = await bcrypt.hash('999999', 10);
        
        try {
            await UserModel.create({
                npk: '999999',
                password_hash: userPassword
            });
            console.log('✅ Default user created (NPK: 999999, Password: 999999)');
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

