import diseaseModel from '../models/diseaseModel.js';

class DiseaseService {
    async getAllDiseases() {
        return diseaseModel.getAllDiseases();
    }

    async getDiseaseById(diseaseId) {
        if (!diseaseId) {
            throw new Error('Disease ID is required');
        }
        return diseaseModel.getDiseaseById(diseaseId);
    }

    async createDisease(diseaseData) {
        if (!diseaseData || !diseaseData.name || !diseaseData.description) {
            throw new Error('All fields are required');
        }
        return diseaseModel.createDisease(diseaseData);
    }

    async updateDisease(diseaseId, diseaseData) {
        if (!diseaseId || !diseaseData) {
            throw new Error('Disease ID and data are required');
        }
        if (!diseaseData.name || !diseaseData.description) {
            throw new Error('All fields are required');
        }
        const existingDisease = await diseaseModel.getDiseaseById(diseaseId);
        if (!existingDisease) {
            throw new Error('Disease not found');
        }
        return diseaseModel.updateDisease(diseaseId, diseaseData);
    }

    async deleteDisease(diseaseId) {
        return diseaseModel.deleteDisease(diseaseId);
    }
}
export default new DiseaseService();