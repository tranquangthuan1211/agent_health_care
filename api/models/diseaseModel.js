import {pool} from "../config/db-config.js";
class DiseaseModel {
    static async getAllDiseases() {
        const query = 'SELECT * FROM diseases';
        const [rows] = await pool.query(query);
        return rows;
    }
    static async getDiseaseById(diseaseId) {
        const query = 'SELECT * FROM diseases WHERE id = ?';
        const [rows] = await pool.query(query, [diseaseId]);
        return rows[0];
    }
    static async createDisease(diseaseData) {
        const query = 'INSERT INTO diseases (name, description) VALUES (?, ?)';
        const [result] = await pool.query(query, [
            diseaseData.name,
            diseaseData.description
        ]);
        return result.insertId;
    }
    static async updateDisease(diseaseId, diseaseData) {
        const query = 'UPDATE diseases SET name = ?, description = ? WHERE id = ?';
        await pool.query(query, [
            diseaseData.name,
            diseaseData.description,
            diseaseId
        ]);
    }      
    static async deleteDisease(diseaseId) {
        const query = 'DELETE FROM diseases WHERE id = ?';
        await pool.query(query, [diseaseId]);
    }
}
export default DiseaseModel;