-- Run this once, logged in as root (e.g. `mysql -u root -p` then paste this file's contents,
-- or open it in MySQL Workbench and execute).
-- It creates a dedicated, low-privilege user for the AceInterview app instead of using root.

CREATE DATABASE IF NOT EXISTS aceinterview CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'aceinterview_app'@'localhost' IDENTIFIED BY 'ChangeThisPassword123!';
GRANT ALL PRIVILEGES ON aceinterview.* TO 'aceinterview_app'@'localhost';
FLUSH PRIVILEGES;
