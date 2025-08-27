-- =============================================
-- SelfiNotify Database Setup Script
-- =============================================
-- This script creates the database, tables, and seeds initial data
-- Execute this script in SQL Server Management Studio or any SQL client

-- =============================================
-- 1. Create Database
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SelfiNotify')
BEGIN
    CREATE DATABASE [SelfiNotify]
END
GO

-- Use the SelfiNotify database
USE [SelfiNotify]
GO

-- =============================================
-- 2. Create Tables
-- =============================================

-- Create applications table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'applications')
BEGIN
    CREATE TABLE applications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(150) NOT NULL,
        description NTEXT NULL,
        platform NVARCHAR(20) NOT NULL,
        app_token NVARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table "applications" created successfully';
END
ELSE
BEGIN
    PRINT 'Table "applications" already exists';
END
GO

-- Create notifications table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    CREATE TABLE notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        application_id INT NOT NULL,
        title NVARCHAR(255) NOT NULL,
        message NTEXT NOT NULL,
        file_url NVARCHAR(500) NULL,
        sent_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_notifications_applications FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );
    PRINT 'Table "notifications" created successfully';
END
ELSE
BEGIN
    PRINT 'Table "notifications" already exists';
END
GO

-- =============================================
-- 3. Create Indexes for Performance
-- =============================================

-- Index on app_token for fast lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_applications_app_token')
BEGIN
    CREATE UNIQUE INDEX IX_applications_app_token ON applications(app_token);
    PRINT 'Index "IX_applications_app_token" created successfully';
END
GO

-- Index on application_id for foreign key lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_notifications_application_id')
BEGIN
    CREATE INDEX IX_notifications_application_id ON notifications(application_id);
    PRINT 'Index "IX_notifications_application_id" created successfully';
END
GO

-- Index on sent_at for date-based queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_notifications_sent_at')
BEGIN
    CREATE INDEX IX_notifications_sent_at ON notifications(sent_at);
    PRINT 'Index "IX_notifications_sent_at" created successfully';
END
GO

-- =============================================
-- 4. Seed Initial Data
-- =============================================

-- Check if data already exists
IF NOT EXISTS (SELECT TOP 1 1 FROM applications)
BEGIN
    -- Insert sample applications
    INSERT INTO applications (name, description, platform, app_token, created_at) VALUES
    ('SelfiNotify Mobile App', 'Aplikasi mobile untuk notifikasi real-time', 'mobile', 'app_sample_mobile_1234567890abcdef', GETDATE()),
    ('SelfiNotify Web Dashboard', 'Dashboard web untuk manajemen notifikasi', 'website', 'app_sample_web_0987654321fedcba', GETDATE()),
    ('Test Application', 'Aplikasi untuk testing notifikasi', 'mobile', 'app_test_abcdef1234567890', GETDATE());
    
    PRINT 'Sample applications created successfully';
    
    -- Insert sample notifications
    INSERT INTO notifications (application_id, title, message, file_url, sent_at) VALUES
    (1, 'Selamat Datang di SelfiNotify', 'Selamat datang! Aplikasi ini siap menerima notifikasi real-time dari dashboard.', NULL, GETDATE()),
    (2, 'Dashboard Ready', 'Dashboard web telah siap digunakan untuk mengirim notifikasi ke aplikasi mobile.', NULL, GETDATE()),
    (1, 'Test Notification', 'Ini adalah notifikasi test untuk memastikan sistem berfungsi dengan baik.', NULL, GETDATE());
    
    PRINT 'Sample notifications created successfully';
END
ELSE
BEGIN
    PRINT 'Data already exists, skipping seed';
END
GO

-- =============================================
-- 5. Verify Setup
-- =============================================

-- Show created tables
SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;
GO

-- Show data counts
SELECT 
    'applications' as table_name,
    COUNT(*) as record_count
FROM applications
UNION ALL
SELECT 
    'notifications' as table_name,
    COUNT(*) as record_count
FROM notifications;
GO

-- Show sample data
SELECT TOP 3 * FROM applications ORDER BY id;
GO

SELECT TOP 3 * FROM notifications ORDER BY id;
GO

PRINT '=============================================';
PRINT 'SelfiNotify Database Setup Completed!';
PRINT '=============================================';
PRINT 'You can now start the SelfiNotify application';
PRINT '=============================================';
GO
