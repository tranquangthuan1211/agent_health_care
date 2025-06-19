import { pool } from "../config/db-config.js";
class AppointmentModel {

  static async createAppointment(patientId, doctorId, appointment_date) {
    const query = `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(query, [patientId, doctorId, appointment_date]);
    return result.insertId;
  }

  static async getAppointmentsByPatientId(patientId) {
    const query = `
      SELECT * FROM appointments
      WHERE patient_id = ?
      ORDER BY appointment_date DESC, time DESC
    `;
    const [rows] = await pool.execute(query, [patientId]);
    return rows;
  }

  static async deleteAppointment(appointmentId) {
    const query = `
      DELETE FROM appointments
      WHERE id = ?
    `;
    await pool.execute(query, [appointmentId]);
  }
}

export default AppointmentModel;