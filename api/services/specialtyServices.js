import SpecialtyModel from "../models/specialtyModel.js";

class SpecialtyService {
    async getAllSpecialties() {
        return SpecialtyModel.getAllSpecialties();
    }

    async getSpecialtyById(specialtyId) {
        if (!specialtyId) {
            throw new Error('Specialty ID is required');
        }
        return SpecialtyModel.getSpecialtyById(specialtyId);
    }

    async createSpecialty(specialtyData) {
        if (!specialtyData || !specialtyData.name || !specialtyData.description) {
            throw new Error('All fields are required');
        }
        return SpecialtyModel.createSpecialty(specialtyData);
    }

    async updateSpecialty(specialtyId, specialtyData) {
        if (!specialtyId || !specialtyData) {
            throw new Error('Specialty ID and data are required');
        }
        if (!specialtyData.name || !specialtyData.description) {
            throw new Error('All fields are required');
        }
        const existingSpecialty = await SpecialtyModel.getSpecialtyById(specialtyId);
        if (!existingSpecialty) {
            throw new Error('Specialty not found');
        }
        return SpecialtyModel.updateSpecialty(specialtyId, specialtyData);
    }

    async deleteSpecialty(specialtyId) {
        return SpecialtyModel.deleteSpecialty(specialtyId);
    }
}
export default new SpecialtyService();