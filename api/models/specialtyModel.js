import {pool} from "../config/db-config.js";
class SpecialtyModel {
    static async getAllSpecialties() {
        const query = 'SELECT * FROM specialties';
        const [rows] = await pool.query(query);
        return rows;
    }
    static async getSpecialtyById(specialtyId) {
        const query = 'SELECT * FROM specialties WHERE id = ?';
        const [rows] = await pool.query(query, [specialtyId]);
        return rows[0];
    }
    static async createSpecialty(specialtyData) {
        const query = 'INSERT INTO specialties (name, description) VALUES (?, ?)';
        const [result] = await pool.query(query, [
            specialtyData.name,
            specialtyData.description
        ]);
        return result.insertId;
    }
    static async updateSpecialty(specialtyId, specialtyData) {
        const query = 'UPDATE specialties SET name = ?, description = ? WHERE id = ?';
        await pool.query(query, [
            specialtyData.name,
            specialtyData.description,
            specialtyId
        ]);
    }
    static async deleteSpecialty(specialtyId) {
        const query = 'DELETE FROM specialties WHERE id = ?';
        await pool.query(query, [specialtyId]);
    }
}
export default SpecialtyModel;