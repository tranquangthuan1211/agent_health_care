import {pool} from '../config/db-config.js';
import {hashPassword} from '../securities/hashPassword.js';
class UserModel {
    static async createUser(userData) {
        const { username, phone, address, email, password, role, created_at } = userData;
        const query = `
            INSERT INTO users (username, phone, address, email, password, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [username, phone, address, email, password, role, created_at]);
        return result.insertId;
    }
    static async getUserByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);
        return rows[0];
    }
    static async checkUserExists(username) {
        const query = 'SELECT * FROM users WHERE username = ?';
        const [rows] = await pool.execute(query, [username]);
        return rows.length > 0;
    }
    static async getUserById(userId) {
        const query = 'SELECT * FROM users WHERE id = ?';
        const [rows] = await pool.execute(query, [userId]);
        return rows[0];
    }

    static async updateUser(userId, userData) {
        const { username, phone, address, email } = userData;
        const query = `
            UPDATE users
            SET username = ?, phone = ?, address = ?, email = ?
            WHERE id = ?
        `;
        await pool.execute(query, [username, phone, address, email, userId]);
    }

    static async deleteUser(userId) {
        const query = 'DELETE FROM users WHERE id = ?';
        await pool.execute(query, [userId]);
    }
}
export default UserModel;