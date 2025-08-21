#!/usr/bin/env node

/**
 * 临时数据库连接模块
 * 用于解决Prisma客户端问题
 */

const { Database } = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.join(__dirname, '..', 'db', 'custom.db');
const db = new Database(dbPath);

// 简单的查询函数
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 简单的执行函数
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// 创建必要的表结构
async function initDatabase() {
  console.log('🗄️ 初始化数据库...');
  
  // 创建用户表
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'PENDING',
      role TEXT DEFAULT 'USER',
      email_verified INTEGER DEFAULT 0,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建角色表
  await run(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      systemPrompt TEXT NOT NULL,
      avatar TEXT,
      modelConfig TEXT,
      participationLevel REAL DEFAULT 0.7,
      interestThreshold REAL DEFAULT 0.5,
      memoryBankPath TEXT,
      category TEXT DEFAULT 'custom',
      theme TEXT,
      filePath TEXT,
      isActive INTEGER DEFAULT 1,
      userId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 创建聊天室表
  await run(`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      theme TEXT,
      isActive INTEGER DEFAULT 1,
      userId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 创建消息表
  await run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      senderType TEXT NOT NULL,
      senderId TEXT,
      chatRoomId TEXT NOT NULL,
      contextSummary TEXT,
      interestScore REAL,
      participationReason TEXT,
      memorySnapshot TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chatRoomId) REFERENCES chat_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (senderId) REFERENCES characters(id) ON DELETE SET NULL
    )
  `);

  console.log('✅ 数据库初始化完成');
}

// 用户相关操作
const userOperations = {
  async create(userData) {
    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await run(`
      INSERT INTO users (id, email, name, password_hash, status, role, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [id, userData.email, userData.name || '', userData.password_hash || '', userData.status || 'PENDING', userData.role || 'USER', userData.email_verified ? 1 : 0]);
    return { id, ...userData };
  },

  async findByEmail(email) {
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    return users[0] || null;
  },

  async findById(id) {
    const users = await query('SELECT * FROM users WHERE id = ?', [id]);
    return users[0] || null;
  },

  async update(id, updates) {
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    if (fields.length === 0) return null;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);
    
    await run(`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await run('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }
};

// 角色相关操作
const characterOperations = {
  async create(characterData) {
    const id = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await run(`
      INSERT INTO characters (id, name, systemPrompt, avatar, modelConfig, participationLevel, interestThreshold, memoryBankPath, category, theme, filePath, isActive, userId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [id, characterData.name, characterData.systemPrompt, characterData.avatar, characterData.modelConfig, characterData.participationLevel || 0.7, characterData.interestThreshold || 0.5, characterData.memoryBankPath, characterData.category || 'custom', characterData.theme, characterData.filePath, characterData.isActive ? 1 : 0, characterData.userId]);
    return { id, ...characterData };
  },

  async findByUserId(userId) {
    return await query('SELECT * FROM characters WHERE userId = ? AND isActive = 1', [userId]);
  },

  async findByIdAndUserId(id, userId) {
    const characters = await query('SELECT * FROM characters WHERE id = ? AND userId = ? AND isActive = 1', [id, userId]);
    return characters[0] || null;
  }
};

// 聊天室相关操作
const chatroomOperations = {
  async create(roomData) {
    const id = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await run(`
      INSERT INTO chat_rooms (id, name, theme, isActive, userId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [id, roomData.name, roomData.theme, roomData.isActive ? 1 : 1, roomData.userId]);
    return { id, ...roomData };
  },

  async findByUserId(userId) {
    return await query('SELECT * FROM chat_rooms WHERE userId = ? AND isActive = 1 ORDER BY createdAt DESC', [userId]);
  },

  async findByIdAndUserId(id, userId) {
    const rooms = await query('SELECT * FROM chat_rooms WHERE id = ? AND userId = ? AND isActive = 1', [id, userId]);
    return rooms[0] || null;
  }
};

module.exports = {
  initDatabase,
  query,
  run,
  user: userOperations,
  character: characterOperations,
  chatroom: chatroomOperations
};