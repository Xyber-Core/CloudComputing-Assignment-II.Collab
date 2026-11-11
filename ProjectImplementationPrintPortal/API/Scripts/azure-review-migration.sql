-- Run against an existing Azure SQL PrintPortal database after reviewing backup policy.
IF COL_LENGTH('dbo.PrintRequest','RejectedAt') IS NULL ALTER TABLE dbo.PrintRequest ADD RejectedAt datetime2 NULL;
IF COL_LENGTH('dbo.PrintRequest','RejectedBy') IS NULL ALTER TABLE dbo.PrintRequest ADD RejectedBy nvarchar(100) NULL;
IF COL_LENGTH('dbo.PrintRequest','RejectionReason') IS NULL ALTER TABLE dbo.PrintRequest ADD RejectionReason nvarchar(500) NULL;
IF COL_LENGTH('dbo.PrintRequest','DeletedAt') IS NULL ALTER TABLE dbo.PrintRequest ADD DeletedAt datetime2 NULL;
IF COL_LENGTH('dbo.PrintRequest','DeletedBy') IS NULL ALTER TABLE dbo.PrintRequest ADD DeletedBy nvarchar(100) NULL;
IF COL_LENGTH('dbo.StatusHistory','EventType') IS NULL ALTER TABLE dbo.StatusHistory ADD EventType nvarchar(20) NOT NULL CONSTRAINT DF_StatusHistory_EventType DEFAULT 'Status';
IF COL_LENGTH('dbo.StatusHistory','Note') IS NULL ALTER TABLE dbo.StatusHistory ADD Note nvarchar(500) NULL;
