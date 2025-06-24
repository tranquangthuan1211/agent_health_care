import paymentService from "../services/paymentService.js";

class PaymentController {
    async createPayment(req, res) {
        try {
            const { userId, amount, currency } = req.body;
            console.log("Received payment data:", { userId, amount, currency });
            const payment = await paymentService.createPayment(userId, amount, currency);
            res.status(201).json({ success: true, paymentId: payment });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getPaymentsByUserId(req, res) {
        try {
            const { userId } = req.params;
            const payments = await paymentService.getPaymentsByUserId(userId);
            res.status(200).json(payments);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
export default new PaymentController();