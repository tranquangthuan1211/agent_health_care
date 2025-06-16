import { pool } from "../config/db-config.js";

class DoctorModel {
    static async getAllDoctors() {
        const query = 'SELECT doctors.*, specialties.name AS specialty_name, Clinics.name AS clinic_name FROM doctors \
                        join specialties on doctors.specialty_id = specialties.id \
                        join Clinics on doctors.clinic_id = Clinics.id \
                        ';
        const [rows] = await pool.query(query);
        return rows;
    }

    static async getDoctorById(doctorId) {
        const query = 'SELECT * FROM doctors \
                        join specialties on doctors.specialty_id = specialties.id \
                        join Clinics on doctors.clinic_id = Clinics.id \
                        WHERE doctors.id = ?';
        const [rows] = await pool.query(query, [doctorId]);
        return rows[0];
    }

    static async createDoctor(doctorData) {
        const query = 'INSERT INTO doctors (name, specialty, phone, email) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(query, [
            doctorData.name,
            doctorData.specialty,
            doctorData.phone,
            doctorData.email
        ]);
        return result.insertId;
    }

    static async updateDoctor(doctorId, doctorData) {
        const query = 'UPDATE doctors SET name = ?, specialty = ?, phone = ?, email = ? WHERE id = ?';
        await pool.query(query, [
            doctorData.name,
            doctorData.specialty,
            doctorData.phone,
            doctorData.email,
            doctorId
        ]);
    }

    static async deleteDoctor(doctorId) {
        const query = 'DELETE FROM doctors WHERE id = ?';
        await pool.query(query, [doctorId]);
    }
}
export default DoctorModel;