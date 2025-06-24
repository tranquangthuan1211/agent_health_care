import paymentModel from "../models/paymentModel.js";

class PaymentService {
    static async createPayment(userId, appointmentId, paymentDate, amount, status) {
        try {
            if (!userId || !appointmentId || !paymentDate || !amount || !status) {
                throw new Error("All payment fields are required");
            }
            const paymentId = await paymentModel.createPayment(userId, appointmentId, paymentDate, amount, status);
            return paymentId;
        } catch (error) {
            throw new Error(`Error creating payment: ${error.message}`);
        }
    }

    static async getPaymentsByUserId(userId) {
        try {
            const payments = await paymentModel.getPaymentsByUserId(userId);
            return payments;
        } catch (error) {
            throw new Error(`Error fetching payments: ${error.message}`);
        }
    }

    static async updatePaymentStatus(paymentId, status) {
        try {
            await paymentModel.updatePaymentStatus(paymentId, status);
        } catch (error) {
            throw new Error(`Error updating payment status: ${error.message}`);
        }
    }
}
export default PaymentService;