import {pool} from "../config/db-config.js";

class PaymentModel {
    static async createPayment(userId, appointmentId, paymentDate, amount, status) {
        const query = `
        INSERT INTO payments (user_id, appointment_id,payment_date,amount, status)
        VALUES (?, ?, ?)
        `;
        const [result] = await pool.execute(query, [userId, appointmentId, paymentDate, amount, status]);
        return result.insertId;
    }
    
    static async getPaymentsByUserId(userId) {
        const query = `
        SELECT * FROM payments
        WHERE user_id = ?
        ORDER BY created_at DESC
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    }
    
    static async updatePaymentStatus(paymentId, status) {
        const query = `
        UPDATE payments
        SET status = ?
        WHERE id = ?
        `;
        await pool.execute(query, [status, paymentId]);
    }
}
export default PaymentModel;