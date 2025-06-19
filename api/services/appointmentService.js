import appointmentModel from "../models/appointmentModel.js";

class AppointmentService {
  static async createAppointment(patient_id, doctorId, appointment_date) {
    if (!patient_id || !doctorId || !appointment_date) {
      throw new Error("Patient ID, doctor ID, and appointment date are required to create an appointment.");
    }
    return await appointmentModel.createAppointment(patient_id, doctorId, appointment_date);
  }

  static async getAppointmentsByPatientId(patient_id) {
    if (!patient_id) {
      throw new Error("Patient ID is required to retrieve appointments.");
    }
    return await appointmentModel.getAppointmentsByPatientId(patient_id);
  }

  static async deleteAppointment(appointmentId) {
    if (!appointmentId) {
      throw new Error("Appointment ID is required to delete an appointment.");
    }
    return await appointmentModel.deleteAppointment(appointmentId);
  }
}
export default AppointmentService;