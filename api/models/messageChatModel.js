import { pool } from "../config/db-config.js";
class MessagesChatModel {
  static async createHistoryChat(userId, message, type) {
    const query = `
      INSERT INTO messages (user_id, message, type)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(query, [userId, message, type]);
    return result.insertId;
  }

  static async getHistoryChatsByUserId(userId) {
    const query = `
      SELECT * FROM messages
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
  }

  static async deleteHistoryChat(chatId) {
    const query = `
      DELETE FROM history_chats
      WHERE id = ?
    `;
    await pool.execute(query, [chatId]);
  }
}

export default MessagesChatModel;