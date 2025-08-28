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

-- Create notifications table with essential Message Queue fields
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    CREATE TABLE notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        application_id INT NOT NULL,
        title NVARCHAR(255) NOT NULL,
        message NTEXT NOT NULL,
        file_url NVARCHAR(500) NULL,
        status NVARCHAR(20) DEFAULT 'pending' NOT NULL,
        delivery_attempts INT DEFAULT 0 NOT NULL,
        max_retries INT DEFAULT 3 NOT NULL,
        last_delivery_attempt DATETIME2 NULL,
        sent_at DATETIME2 DEFAULT GETDATE(),
        delivered_at DATETIME2 NULL,
        CONSTRAINT FK_notifications_applications FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );
    PRINT 'Table "notifications" created successfully with Message Queue fields';
END
ELSE
BEGIN
    PRINT 'Table "notifications" already exists, checking for Message Queue fields...';
    
    -- Add new fields for Message Queue System if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND name = 'status')
    BEGIN
        ALTER TABLE notifications ADD status NVARCHAR(20) DEFAULT 'pending' NOT NULL;
        PRINT 'Field "status" added to notifications table';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND name = 'delivery_attempts')
    BEGIN
        ALTER TABLE notifications ADD delivery_attempts INT DEFAULT 0 NOT NULL;
        PRINT 'Field "delivery_attempts" added to notifications table';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND name = 'max_retries')
    BEGIN
        ALTER TABLE notifications ADD max_retries INT DEFAULT 3 NOT NULL;
        PRINT 'Field "max_retries" added to notifications table';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND name = 'last_delivery_attempt')
    BEGIN
        ALTER TABLE notifications ADD last_delivery_attempt DATETIME2 NULL;
        PRINT 'Field "last_delivery_attempt" added to notifications table';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND name = 'delivered_at')
    BEGIN
        ALTER TABLE notifications ADD delivered_at DATETIME2 NULL;
        PRINT 'Field "delivered_at" added to notifications table';
    END
    
    -- Remove priority field if it exists (no longer needed)
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND name = 'priority')
    BEGIN
        ALTER TABLE notifications DROP COLUMN priority;
        PRINT 'Field "priority" removed from notifications table';
    END
    
    -- Remove scheduled_for field if it exists (no longer needed)
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND name = 'scheduled_for')
    BEGIN
        ALTER TABLE notifications DROP COLUMN scheduled_for;
        PRINT 'Field "scheduled_for" removed from notifications table';
    END
    
    -- Update existing notifications that don't have status
    UPDATE notifications 
    SET status = 'sent' 
    WHERE status IS NULL OR status = '';
    PRINT 'Updated existing notifications with default status';
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

-- Essential indexes for Message Queue System
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_notifications_status')
BEGIN
    CREATE INDEX IX_notifications_status ON notifications(status);
    PRINT 'Index "IX_notifications_status" created successfully';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_notifications_application_id_status')
BEGIN
    CREATE INDEX IX_notifications_application_id_status ON notifications(application_id, status);
    PRINT 'Index "IX_notifications_application_id_status" created successfully';
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
    
    -- Insert sample notifications with essential Message Queue fields
    INSERT INTO notifications (application_id, title, message, file_url, status, sent_at) VALUES
    (1, 'Selamat Datang di SelfiNotify', 'Selamat datang! Aplikasi ini siap menerima notifikasi real-time dari dashboard.', NULL, 'sent', GETDATE()),
    (2, 'Dashboard Ready', 'Dashboard web telah siap digunakan untuk mengirim notifikasi ke aplikasi mobile.', NULL, 'sent', GETDATE()),
    (1, 'Test Notification', 'Ini adalah notifikasi test untuk memastikan sistem berfungsi dengan baik.', NULL, 'sent', GETDATE());
    
    PRINT 'Sample notifications created successfully with essential Message Queue fields';
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

-- Show simplified table structure for notifications
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'notifications' 
ORDER BY ORDINAL_POSITION;
GO

-- Show all indexes for notifications table
SELECT 
    i.name AS index_name,
    i.type_desc AS index_type,
    STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS columns
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('notifications')
GROUP BY i.name, i.type_desc
ORDER BY i.name;
GO

PRINT '=============================================';
PRINT 'SelfiNotify Database Setup Completed!';
PRINT '=============================================';
PRINT 'Essential Message Queue System fields added successfully';
PRINT 'Priority and scheduling features removed for simplicity';
PRINT 'You can now start the SelfiNotify application';
PRINT '=============================================';
GO
