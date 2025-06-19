import AppointmentService from "../services/appointmentService.js";
class AppointmentController {
    async index (req, res) {
        res.json({
            message: "Welcome to the Appointment API"
        });
    }
    async createAppointment(req, res) {
        try {
            const { patientId, doctorId, appointment_date} = req.body;
            const appointment = await AppointmentService.createAppointment(patientId, doctorId, appointment_date);
            res.status(201).json({ success: true, appointmentId: appointment });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

}
export default new AppointmentController();