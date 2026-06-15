import mysql from 'mysql2/promise';
import { environment } from '../environments/environment.js';

const { host, port, user, password, database } = environment.db;

export const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


const createTables = async () => {
  // users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('member', 'admin') DEFAULT 'member',
      isBanned TINYINT(1) DEFAULT 0,
      bio TEXT NULL,
      avatar VARCHAR(255) NULL,
      lastActive DATETIME NULL,
      recoveryCode VARCHAR(255) NULL,
      favoriteGenres VARCHAR(255) NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // watchlist table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      tmdbId INT NOT NULL,
      mediaType ENUM('movie', 'tv') NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // watched_items table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS watched_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      tmdbId INT NOT NULL,
      mediaType ENUM('movie', 'tv') NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // friendships table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requesterId INT NOT NULL,
      addresseeId INT NOT NULL,
      status ENUM('pending', 'accepted') DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (requesterId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (addresseeId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // ratings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      tmdbId INT NOT NULL,
      mediaType ENUM('movie', 'tv') NOT NULL,
      rating INT NOT NULL,
      comment TEXT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // notifications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      type ENUM('friend_request', 'rating', 'report_result', 'report_admin') NOT NULL,
      message TEXT NOT NULL,
      \`read\` TINYINT(1) DEFAULT 0,
      relatedUserId INT NULL,
      relatedMediaId INT NULL,
      relatedMediaType VARCHAR(255) NULL,
      relatedReportId INT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // reports table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reporterId INT NOT NULL,
      ratingId INT NOT NULL,
      reason ENUM('spoiler', 'other') NOT NULL,
      comment TEXT NULL,
      status ENUM('pending', 'resolved') DEFAULT 'pending',
      actionTaken TINYINT(1) NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (reporterId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ratingId) REFERENCES ratings(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);
};

export const connectDB = async () => {
  try {
    // Ensure the database itself exists by connecting to host first without specifying DB
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();

    console.log('Connection to MySQL DB has been established successfully.');
    await createTables();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};
