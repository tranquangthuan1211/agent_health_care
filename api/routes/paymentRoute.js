import paymentController from "../controllers/paymentController.js";
import express from "express";
const routes = express.Router();

function usePaymentRoute() {
    // Create a new payment
    routes.post("/", paymentController.createPayment);

    // Get payments by user ID
    // routes.get("/:userId", paymentController.getPaymentsByUserId);

    // Update payment status (if needed)
    // routes.put("/payments/:paymentId/status", paymentController.updatePaymentStatus);

    return routes;
}
export default usePaymentRoute;