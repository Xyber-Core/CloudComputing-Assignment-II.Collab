-- Users: customers and coordinators
CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (
        role IN ('Customer', 'Coordinator')
    )
);

-- Print requests submitted by customers
CREATE TABLE IF NOT EXISTS PrintRequest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerId TEXT NOT NULL,
    campaignReference TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN ('Posters', 'Flyers', 'Booklets')
    ),
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (
        priority IN ('Low', 'Normal', 'High')
    ),
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (
        status IN ('Submitted', 'Assigned', 'In Progress', 'Completed')
    ),
    assignee TEXT,
    rejectedAt TEXT,
    rejectedBy TEXT,
    rejectionReason TEXT,
    deletedAt TEXT,
    deletedBy TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customerId) REFERENCES Users(id)
);

-- Records changes to request statuses
CREATE TABLE IF NOT EXISTS StatusHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requestId INTEGER NOT NULL,
    previousStatus TEXT,
    newStatus TEXT NOT NULL,
    actor TEXT NOT NULL,
    changedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eventType TEXT NOT NULL DEFAULT 'Status',
    note TEXT,

    FOREIGN KEY (requestId) REFERENCES PrintRequest(id)
);

-- Indexes for common searches
CREATE INDEX IF NOT EXISTS idx_request_customer
ON PrintRequest(customerId);

CREATE INDEX IF NOT EXISTS idx_request_status
ON PrintRequest(status);

CREATE INDEX IF NOT EXISTS idx_history_request
ON StatusHistory(requestId);

-- Demo users used by the existing application
INSERT OR IGNORE INTO Users (id, role)
VALUES
    ('customer-a', 'Customer'),
    ('customer-b', 'Customer'),
    ('coordinator', 'Coordinator');