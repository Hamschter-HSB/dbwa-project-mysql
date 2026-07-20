import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { environment } from './src/environments/environment.js';

const { host, port, user, password, database } = environment.db;

async function run() {
  try {
    // Ensure the database itself exists
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();

    // Connect to the database
    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
    });

    try {
      await pool.execute('DROP TABLE IF EXISTS users_backup;');
    } catch (e) {}

    // Make sure the users table is created before inserting the admin
    await pool.execute(`
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

    const hashedPassword = await bcrypt.hash('dozent123', 10);
    
    // Check if the admin user exists
    const [users]: any = await pool.execute('SELECT * FROM users WHERE email = ?', ['dozent@hsb.hsb']);
    
    if (users.length > 0) {
      // Update role and password if user already exists
      await pool.execute(
        'UPDATE users SET role = ?, password = ? WHERE email = ?',
        ['admin', hashedPassword, 'dozent@hsb.hsb']
      );
    } else {
      // Create new admin user
      await pool.execute(
        'INSERT INTO users (username, email, password, role, isBanned, recoveryCode) VALUES (?, ?, ?, ?, ?, ?)',
        ['dozent', 'dozent@hsb.hsb', hashedPassword, 'admin', 0, 'jaws-starwars-alien-rocky']
      );
    }

    console.log("Admin user created successfully.");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Setup admin script failed:", error);
    process.exit(1);
  }
}

run();
