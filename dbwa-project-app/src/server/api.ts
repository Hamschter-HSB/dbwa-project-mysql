import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

export const apiRouter = Router();

const JWT_SECRET = 'geht-dich-garnichts-an-HSB-TO-THE-MOON';

// Authentication Middleware
export const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      // Update last active time asynchronously
      pool.execute('UPDATE users SET lastActive = ? WHERE id = ?', [new Date(), user.id]).catch(() => {});
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const MOVIES = [
  "starwars", "grownups", "avatar", "titanic", "matrix", "inception", "gladiator", "jaws",
  "jurassicpark", "rocky", "alien", "terminator", "predator", "batman", "superman",
  "spiderman", "ironman", "avengers", "deadpool", "wolverine", "xmen", "transformers",
  "shrek", "toystory", "nemo", "up", "frozen", "moana", "lionking", "aladdin",
  "mulan", "tarzan", "hercules", "pocahontas", "cinderella", "snowwhite", "sleepingbeauty",
  "pinocchio", "dumbo", "bambi", "peterpan", "robinhood", "junglebook", "aristocats",
  "101dalmatians", "ladyandthetramp", "swordinthestone", "blackcauldron", "greatmousedetective", "oliverandcompany",
  "littlemermaid", "beautyandthebeast", "hunchback", "atlantis", "treasureplanet", "brotherbear", "homeontherange",
  "chickenlittle", "meettherobinsons", "bolt", "princessandthefrog", "tangled", "wreckitralph", "bighero6",
  "zootopia", "encanto", "coco", "insideout", "gooddinosaur", "findingdory", "cars",
  "incredibles", "ratatouille", "walle", "brave", "monstersinc", "bugslife", "luca",
  "soul", "onward", "goodfellas", "godfather", "scarface", "casino", "taxi",
  "pulpfiction", "fightclub", "se7en", "zodiac", "shining", "psycho", "vertigo",
  "halloween", "scream", "saw", "ring", "grudge", "conjuring", "insidious"
];

function generateRecoveryCode(): string {
  const chosen = [];
  for (let i = 0; i < 4; i++) {
    const r = Math.floor(Math.random() * MOVIES.length);
    chosen.push(MOVIES[r]);
  }
  return chosen.join('-');
}

// --- AUTHENTICATION ROUTES ---

apiRouter.post('/auth/register', async (req: any, res: any): Promise<any> => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });

    const [existingUsers]: any = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const recoveryCode = generateRecoveryCode();
    
    const [result]: any = await pool.execute(
      'INSERT INTO users (username, email, password, recoveryCode) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, recoveryCode]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: { id: userId, username, email }, recoveryCode });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed' });
  }
});

apiRouter.post('/auth/login', async (req: any, res: any): Promise<any> => {
  try {
    const { email, password } = req.body;
    const [users]: any = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ error: 'Account banned' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

apiRouter.post('/auth/reset-password', async (req: any, res: any): Promise<any> => {
  try {
    const { email, recoveryCode, newPassword } = req.body;
    if (!email || !recoveryCode || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [users]: any = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.recoveryCode !== recoveryCode) {
      return res.status(401).json({ error: 'Invalid recovery code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    return res.json({ success: true, message: 'Password has been reset' });
  } catch (error) {
    return res.status(500).json({ error: 'Password reset failed' });
  }
});

// --- USER ROUTES ---

apiRouter.get('/users/me', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const [users]: any = await pool.execute(
      'SELECT id, username, email, role, isBanned, bio, avatar, lastActive, recoveryCode, favoriteGenres, createdAt, updatedAt FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isBanned = !!user.isBanned;
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

apiRouter.put('/users/me', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const { bio, avatar, favoriteGenres, username, email, password } = req.body;
    
    const [users]: any = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const userToUpdate = users[0];
    if (!userToUpdate) return res.status(404).json({ error: 'User not found' });

    let bioVal = bio !== undefined ? bio : userToUpdate.bio;
    let avatarVal = avatar !== undefined ? avatar : userToUpdate.avatar;
    let favoriteGenresVal = favoriteGenres !== undefined ? favoriteGenres : userToUpdate.favoriteGenres;
    let usernameVal = username || userToUpdate.username;
    let emailVal = email || userToUpdate.email;
    let passwordVal = userToUpdate.password;

    if (username) {
      const [existingUser]: any = await pool.execute('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
      if (existingUser.length > 0) return res.status(400).json({ error: 'Username already taken' });
    }
    
    if (email) {
      const [existingEmail]: any = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
      if (existingEmail.length > 0) return res.status(400).json({ error: 'Email already taken' });
    }
    
    if (password) {
      passwordVal = await bcrypt.hash(password, 10);
    }

    await pool.execute(
      'UPDATE users SET bio = ?, avatar = ?, favoriteGenres = ?, username = ?, email = ?, password = ? WHERE id = ?',
      [bioVal, avatarVal, favoriteGenresVal, usernameVal, emailVal, passwordVal, req.user.id]
    );

    const [updatedUsers]: any = await pool.execute(
      'SELECT id, username, email, role, isBanned, bio, avatar, lastActive, recoveryCode, favoriteGenres, createdAt, updatedAt FROM users WHERE id = ?',
      [req.user.id]
    );
    const updatedUser = updatedUsers[0];
    updatedUser.isBanned = !!updatedUser.isBanned;
    return res.json(updatedUser);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

apiRouter.delete('/users/me', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const { recoveryCode } = req.body;
    if (!recoveryCode) return res.status(400).json({ error: 'Recovery code is required' });

    const [users]: any = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.recoveryCode !== recoveryCode) {
      return res.status(401).json({ error: 'Invalid recovery code' });
    }

    const userId = req.user.id;
    // Delete associated data manually to prevent leftovers
    await pool.execute('DELETE FROM watchlist WHERE userId = ?', [userId]);
    await pool.execute('DELETE FROM watched_items WHERE userId = ?', [userId]);
    await pool.execute('DELETE FROM ratings WHERE userId = ?', [userId]);
    await pool.execute('DELETE FROM friendships WHERE requesterId = ? OR addresseeId = ?', [userId, userId]);
    await pool.execute('DELETE FROM notifications WHERE userId = ?', [userId]);
    await pool.execute('DELETE FROM reports WHERE reporterId = ?', [userId]);
    
    const [userRatings]: any = await pool.execute('SELECT id FROM ratings WHERE userId = ?', [userId]);
    if (userRatings.length > 0) {
      const ratingIds = userRatings.map((r: any) => r.id);
      const placeholders = ratingIds.map(() => '?').join(',');
      await pool.execute(`DELETE FROM reports WHERE ratingId IN (${placeholders})`, ratingIds);
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    return res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

apiRouter.get('/users/search', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);
    const [users]: any = await pool.execute(
      'SELECT id, username, avatar FROM users WHERE username LIKE ? AND id != ?',
      [`%${q}%`, req.user.id]
    );
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Search failed' });
  }
});

apiRouter.get('/users/:id', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const [users]: any = await pool.execute(
      'SELECT id, username, email, role, isBanned, bio, avatar, lastActive, recoveryCode, favoriteGenres, createdAt, updatedAt FROM users WHERE id = ?',
      [req.params.id]
    );
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'Not found' });
    user.isBanned = !!user.isBanned;
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// --- WATCHLIST ROUTES ---

apiRouter.get('/watchlist', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId) : req.user.id;
    const [items]: any = await pool.execute('SELECT * FROM watchlist WHERE userId = ?', [userId]);
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

apiRouter.post('/watchlist', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const { tmdbId, mediaType } = req.body;
    const [existing]: any = await pool.execute(
      'SELECT id FROM watchlist WHERE userId = ? AND tmdbId = ? AND mediaType = ?',
      [req.user.id, tmdbId, mediaType]
    );
    if (existing.length > 0) return res.status(400).json({ error: 'Item already in watchlist' });
    
    const [result]: any = await pool.execute(
      'INSERT INTO watchlist (userId, tmdbId, mediaType) VALUES (?, ?, ?)',
      [req.user.id, tmdbId, mediaType]
    );
    const item = { id: result.insertId, userId: req.user.id, tmdbId, mediaType };
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

apiRouter.delete('/watchlist/:id', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    await pool.execute('DELETE FROM watchlist WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

// --- WATCHED LIST ROUTES ---

apiRouter.get('/watched', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId) : req.user.id;
    const [items]: any = await pool.execute('SELECT * FROM watched_items WHERE userId = ?', [userId]);
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch watched list' });
  }
});

apiRouter.post('/watched', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const { tmdbId, mediaType } = req.body;
    // Remove from watchlist if present when marking as watched
    await pool.execute('DELETE FROM watchlist WHERE userId = ? AND tmdbId = ? AND mediaType = ?', [req.user.id, tmdbId, mediaType]);

    const [existing]: any = await pool.execute(
      'SELECT id FROM watched_items WHERE userId = ? AND tmdbId = ? AND mediaType = ?',
      [req.user.id, tmdbId, mediaType]
    );
    if (existing.length > 0) return res.status(400).json({ error: 'Item already in watched list' });
    
    const [result]: any = await pool.execute(
      'INSERT INTO watched_items (userId, tmdbId, mediaType) VALUES (?, ?, ?)',
      [req.user.id, tmdbId, mediaType]
    );
    const item = { id: result.insertId, userId: req.user.id, tmdbId, mediaType };
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add to watched list' });
  }
});

apiRouter.delete('/watched/:tmdbId/:mediaType', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    await pool.execute(
      'DELETE FROM watched_items WHERE tmdbId = ? AND mediaType = ? AND userId = ?',
      [req.params.tmdbId, req.params.mediaType, req.user.id]
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove from watched list' });
  }
});

// --- FRIEND ROUTES ---

apiRouter.post('/friends/request', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const { addresseeId } = req.body;
    if (addresseeId === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' });

    const [existing]: any = await pool.execute(
      'SELECT id FROM friendships WHERE (requesterId = ? AND addresseeId = ?) OR (requesterId = ? AND addresseeId = ?)',
      [req.user.id, addresseeId, addresseeId, req.user.id]
    );
    if (existing.length > 0) return res.status(400).json({ error: 'Friendship or request already exists' });

    await pool.execute(
      'INSERT INTO friendships (requesterId, addresseeId, status) VALUES (?, ?, ?)',
      [req.user.id, addresseeId, 'pending']
    );

    await pool.execute(
      'INSERT INTO notifications (userId, type, message, relatedUserId) VALUES (?, ?, ?, ?)',
      [addresseeId, 'friend_request', `${req.user.username} sent you a friend request.`, req.user.id]
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send request' });
  }
});

apiRouter.put('/friends/accept/:requesterId', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const requesterId = req.params.requesterId;
    const [friendships]: any = await pool.execute(
      'SELECT * FROM friendships WHERE requesterId = ? AND addresseeId = ? AND status = ?',
      [requesterId, req.user.id, 'pending']
    );
    const friendship = friendships[0];
    if (!friendship) return res.status(404).json({ error: 'Request not found' });

    await pool.execute('UPDATE friendships SET status = ? WHERE id = ?', ['accepted', friendship.id]);
    friendship.status = 'accepted';
    return res.json(friendship);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to accept' });
  }
});

apiRouter.get('/friends', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const [friendships]: any = await pool.execute(
      'SELECT * FROM friendships WHERE requesterId = ? OR addresseeId = ?',
      [req.user.id, req.user.id]
    );

    const friendIds = friendships
      .filter((f: any) => f.status === 'accepted')
      .map((f: any) => f.requesterId === req.user.id ? f.addresseeId : f.requesterId);

    const pendingIds = friendships
      .filter((f: any) => f.status === 'pending' && f.addresseeId === req.user.id)
      .map((f: any) => f.requesterId);

    let friends: any[] = [];
    if (friendIds.length > 0) {
      const placeholders = friendIds.map(() => '?').join(',');
      const [resUsers]: any = await pool.execute(
        `SELECT id, username, avatar FROM users WHERE id IN (${placeholders})`,
        friendIds
      );
      friends = resUsers;
    }

    let pending: any[] = [];
    if (pendingIds.length > 0) {
      const placeholders = pendingIds.map(() => '?').join(',');
      const [resUsers]: any = await pool.execute(
        `SELECT id, username, avatar FROM users WHERE id IN (${placeholders})`,
        pendingIds
      );
      pending = resUsers;
    }

    return res.json({ friends, pending });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// --- RATING ROUTES ---

apiRouter.post('/ratings', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const { tmdbId, mediaType, rating, comment, mediaTitle } = req.body;

    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Remove from watchlist if present
    await pool.execute(
      'DELETE FROM watchlist WHERE userId = ? AND tmdbId = ? AND mediaType = ?',
      [req.user.id, tmdbId, mediaType]
    );

    // Save or update rating
    const [ratings]: any = await pool.execute(
      'SELECT * FROM ratings WHERE userId = ? AND tmdbId = ? AND mediaType = ?',
      [req.user.id, tmdbId, mediaType]
    );

    let userRating = ratings[0];
    if (userRating) {
      await pool.execute(
        'UPDATE ratings SET rating = ?, comment = ? WHERE id = ?',
        [rating, comment, userRating.id]
      );
      userRating.rating = rating;
      userRating.comment = comment;
    } else {
      const [result]: any = await pool.execute(
        'INSERT INTO ratings (userId, tmdbId, mediaType, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, tmdbId, mediaType, rating, comment]
      );
      userRating = { id: result.insertId, userId: req.user.id, tmdbId, mediaType, rating, comment };
    }

    // Notify friends
    const [friendships]: any = await pool.execute(
      'SELECT * FROM friendships WHERE (requesterId = ? OR addresseeId = ?) AND status = ?',
      [req.user.id, req.user.id, 'accepted']
    );
    const friendIds = friendships.map((f: any) => f.requesterId === req.user.id ? f.addresseeId : f.requesterId);

    const title = mediaTitle || (mediaType === 'movie' ? 'a movie' : 'a show');
    let notifMessage = `${req.user.username} rated "${title}" with ${rating}/5 stars.`;
    if (comment) {
      notifMessage += ` Comment: "${comment}"`;
    }

    for (const fId of friendIds) {
      await pool.execute(
        'INSERT INTO notifications (userId, type, message, relatedUserId, relatedMediaId, relatedMediaType) VALUES (?, ?, ?, ?, ?, ?)',
        [fId, 'rating', notifMessage, req.user.id, tmdbId, mediaType]
      );
    }

    return res.json(userRating);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to rate' });
  }
});

apiRouter.get('/ratings/media/:mediaType/:tmdbId', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const { mediaType, tmdbId } = req.params;

    const [myRatings]: any = await pool.execute(
      'SELECT * FROM ratings WHERE userId = ? AND mediaType = ? AND tmdbId = ?',
      [req.user.id, mediaType, tmdbId]
    );
    const myRating = myRatings[0] || null;

    const [friendships]: any = await pool.execute(
      'SELECT * FROM friendships WHERE (requesterId = ? OR addresseeId = ?) AND status = ?',
      [req.user.id, req.user.id, 'accepted']
    );
    const friendIds = friendships.map((f: any) => f.requesterId === req.user.id ? f.addresseeId : f.requesterId);

    let friendsRatings: any[] = [];
    if (friendIds.length > 0) {
      const placeholders = friendIds.map(() => '?').join(',');
      const [rows]: any = await pool.execute(
        `SELECT r.*, u.id AS \`user.id\`, u.username AS \`user.username\`, u.avatar AS \`user.avatar\`
         FROM ratings r
         JOIN users u ON r.userId = u.id
         WHERE r.userId IN (${placeholders}) AND r.mediaType = ? AND r.tmdbId = ?`,
        [...friendIds, mediaType, tmdbId]
      );
      friendsRatings = rows.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        tmdbId: row.tmdbId,
        mediaType: row.mediaType,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: row['user.id'],
          username: row['user.username'],
          avatar: row['user.avatar']
        }
      }));
    }

    return res.json({ myRating, friendsRatings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// --- NOTIFICATION ROUTES ---

apiRouter.get('/notifications', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    // Escape standard keyword 'read' using backticks
    const [notifs]: any = await pool.execute(
      'SELECT id, userId, type, message, `read`, relatedUserId, relatedMediaId, relatedMediaType, relatedReportId, createdAt, updatedAt FROM notifications WHERE userId = ? ORDER BY createdAt DESC',
      [req.user.id]
    );
    const formattedNotifs = notifs.map((n: any) => ({
      ...n,
      read: !!n.read
    }));
    return res.json(formattedNotifs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

apiRouter.put('/notifications/:id/read', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    // Escape standard keyword 'read' using backticks
    await pool.execute(
      'UPDATE notifications SET `read` = ? WHERE id = ? AND userId = ?',
      [true, req.params.id, req.user.id]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// --- REPORT ROUTES ---

apiRouter.post('/reports', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const { ratingId, reason, comment } = req.body;

    const [ratings]: any = await pool.execute(
      `SELECT r.*, u.id AS \`user.id\`, u.username AS \`user.username\`
       FROM ratings r
       JOIN users u ON r.userId = u.id
       WHERE r.id = ?`,
      [ratingId]
    );
    const rating = ratings[0];
    if (!rating) return res.status(404).json({ error: 'Rating not found' });
    
    rating.user = {
      id: rating['user.id'],
      username: rating['user.username']
    };

    const [result]: any = await pool.execute(
      'INSERT INTO reports (reporterId, ratingId, reason, comment, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, ratingId, reason, comment, 'pending']
    );
    const reportId = result.insertId;

    // Notify all admins
    const [admins]: any = await pool.execute('SELECT id FROM users WHERE role = ?', ['admin']);
    const reasonText = reason === 'spoiler' ? 'Spoiler' : `Other: ${comment || 'No comment'}`;

    for (const admin of admins) {
      await pool.execute(
        'INSERT INTO notifications (userId, type, message, relatedUserId, relatedMediaId, relatedMediaType, relatedReportId) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [admin.id, 'report_admin', `Report from ${req.user.username}: Comment by ${rating.user.username} has been reported. Reason: ${reasonText}. Please open the Moderatorview to handle it.`, rating.userId, rating.tmdbId, rating.mediaType, reportId]
      );
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to report' });
  }
});

// Admin: resolve a report
apiRouter.put('/reports/:id/resolve', authenticate, async (req: any, res: any): Promise<any> => {
  try {
    const [users]: any = await pool.execute('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { action } = req.body; // 'delete' or 'keep'
    const [reports]: any = await pool.execute('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    const report = reports[0];
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const actionTaken = action === 'delete';

    if (actionTaken) {
      // Delete the comment from the rating (set to null)
      await pool.execute('UPDATE ratings SET comment = ? WHERE id = ?', [null, report.ratingId]);
    }

    await pool.execute(
      'UPDATE reports SET status = ?, actionTaken = ? WHERE id = ?',
      ['resolved', actionTaken ? 1 : 0, report.id]
    );

    // Notify the reporter
    const resultMessage = actionTaken
      ? 'Your report has been processed. Action has been taken.'
      : 'Your report has been processed. No action was taken.';

    await pool.execute(
      'INSERT INTO notifications (userId, type, message) VALUES (?, ?, ?)',
      [report.reporterId, 'report_result', resultMessage]
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resolve report' });
  }
});

// --- ADMIN ROUTES ---

const requireAdmin = async (req: any, res: any, next: any) => {
  const [users]: any = await pool.execute('SELECT role FROM users WHERE id = ?', [req.user.id]);
  const user = users[0];
  if (user && user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
};

apiRouter.get('/admin/users', authenticate, requireAdmin, async (req: any, res: any): Promise<any> => {
  try {
    const [users]: any = await pool.execute(
      'SELECT id, username, email, role, isBanned, bio, avatar, lastActive, recoveryCode, favoriteGenres, createdAt, updatedAt FROM users'
    );
    const formattedUsers = users.map((u: any) => ({
      ...u,
      isBanned: !!u.isBanned
    }));
    return res.json(formattedUsers);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

apiRouter.post('/admin/users', authenticate, requireAdmin, async (req: any, res: any): Promise<any> => {
  try {
    const { username, email, password, role, isBanned } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    
    const [existing]: any = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result]: any = await pool.execute(
      'INSERT INTO users (username, email, password, role, isBanned) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'member', isBanned ? 1 : 0]
    );

    const newUser = {
      id: result.insertId,
      username,
      email,
      role: role || 'member',
      isBanned: !!isBanned
    };
    return res.json({ success: true, user: newUser });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

apiRouter.put('/admin/users/:id', authenticate, requireAdmin, async (req: any, res: any): Promise<any> => {
  try {
    const { username, email, password, isBanned, role } = req.body;
    const [users]: any = await pool.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const userToUpdate = users[0];
    if (!userToUpdate) return res.status(404).json({ error: 'User not found' });

    const usernameVal = username || userToUpdate.username;
    const emailVal = email || userToUpdate.email;
    const passwordVal = password ? await bcrypt.hash(password, 10) : userToUpdate.password;
    const isBannedVal = isBanned !== undefined ? (isBanned ? 1 : 0) : userToUpdate.isBanned;
    const roleVal = role || userToUpdate.role;

    await pool.execute(
      'UPDATE users SET username = ?, email = ?, password = ?, isBanned = ?, role = ? WHERE id = ?',
      [usernameVal, emailVal, passwordVal, isBannedVal, roleVal, req.params.id]
    );

    return res.json({
      success: true,
      user: {
        id: userToUpdate.id,
        username: usernameVal,
        email: emailVal,
        isBanned: !!isBannedVal,
        role: roleVal
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

apiRouter.delete('/admin/users/:id', authenticate, requireAdmin, async (req: any, res: any): Promise<any> => {
  try {
    const userId = req.params.id;
    // Manual cascading deletion
    await pool.execute('DELETE FROM watchlist WHERE userId = ?', [userId]);
    await pool.execute('DELETE FROM watched_items WHERE userId = ?', [userId]);
    await pool.execute('DELETE FROM ratings WHERE userId = ?', [userId]);
    await pool.execute('DELETE FROM friendships WHERE requesterId = ? OR addresseeId = ?', [userId, userId]);
    await pool.execute('DELETE FROM notifications WHERE userId = ?', [userId]);
    await pool.execute('DELETE FROM reports WHERE reporterId = ?', [userId]);

    const [userRatings]: any = await pool.execute('SELECT id FROM ratings WHERE userId = ?', [userId]);
    if (userRatings.length > 0) {
      const ratingIds = userRatings.map((r: any) => r.id);
      const placeholders = ratingIds.map(() => '?').join(',');
      await pool.execute(`DELETE FROM reports WHERE ratingId IN (${placeholders})`, ratingIds);
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

apiRouter.get('/admin/stats', authenticate, requireAdmin, async (req: any, res: any): Promise<any> => {
  try {
    const [[{ totalUsers }]]: any = await pool.execute('SELECT COUNT(*) AS totalUsers FROM users');
    
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [[{ onlineUsers }]]: any = await pool.execute('SELECT COUNT(*) AS onlineUsers FROM users WHERE lastActive > ?', [fiveMinsAgo]);
    
    const [[{ totalComments }]]: any = await pool.execute('SELECT COUNT(*) AS totalComments FROM ratings WHERE comment IS NOT NULL');
    
    const [[{ totalWatchlist }]]: any = await pool.execute('SELECT COUNT(*) AS totalWatchlist FROM watchlist');
    
    const [[{ totalWatched }]]: any = await pool.execute('SELECT COUNT(*) AS totalWatched FROM watched_items');

    return res.json({ totalUsers, onlineUsers, totalComments, totalWatchlist, totalWatched });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

apiRouter.get('/admin/reports', authenticate, requireAdmin, async (req: any, res: any): Promise<any> => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT rep.*, 
              u_reporter.id AS \`reporter.id\`, u_reporter.username AS \`reporter.username\`,
              r.id AS \`rating.id\`, r.userId AS \`rating.userId\`, r.tmdbId AS \`rating.tmdbId\`, 
              r.mediaType AS \`rating.mediaType\`, r.rating AS \`rating.rating\`, r.comment AS \`rating.comment\`,
              r.createdAt AS \`rating.createdAt\`, r.updatedAt AS \`rating.updatedAt\`,
              u_rated.id AS \`rating.user.id\`, u_rated.username AS \`rating.user.username\`
       FROM reports rep
       JOIN users u_reporter ON rep.reporterId = u_reporter.id
       JOIN ratings r ON rep.ratingId = r.id
       JOIN users u_rated ON r.userId = u_rated.id
       WHERE rep.status = 'pending'`
    );

    const reports = rows.map((row: any) => ({
      id: row.id,
      reporterId: row.reporterId,
      ratingId: row.ratingId,
      reason: row.reason,
      comment: row.comment,
      status: row.status,
      actionTaken: row.actionTaken !== null ? !!row.actionTaken : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      reporter: {
        id: row['reporter.id'],
        username: row['reporter.username']
      },
      rating: {
        id: row['rating.id'],
        userId: row['rating.userId'],
        tmdbId: row['rating.tmdbId'],
        mediaType: row['rating.mediaType'],
        rating: row['rating.rating'],
        comment: row['rating.comment'],
        createdAt: row['rating.createdAt'],
        updatedAt: row['rating.updatedAt'],
        user: {
          id: row['rating.user.id'],
          username: row['rating.user.username']
        }
      }
    }));

    return res.json(reports);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});
