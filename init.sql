CREATE TABLE IF NOT EXISTS sync_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    row_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    age INT,
    city VARCHAR(255),
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT DEFAULT 1,
    INDEX idx_row_id (row_id),
    INDEX idx_last_modified (last_modified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    row_id VARCHAR(50),
    action VARCHAR(50),
    source VARCHAR(50),
    data JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
