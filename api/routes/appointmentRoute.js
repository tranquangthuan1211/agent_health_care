import appointmentController from "../controllers/appointmentController.js";
import express from "express";
const router = express.Router();

function useAppointmentRoute() {
    // Route to create a new appointment
    router.get("/", appointmentController.index);
    router.post("/", appointmentController.createAppointment);

    return router;
}
export default useAppointmentRoute;
