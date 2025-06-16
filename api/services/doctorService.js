import doctorModel from '../models/doctorModel.js';

class DoctorService {
    async getAllDoctors() {
        
        return doctorModel.getAllDoctors();
    }

    async getDoctorById(doctorId) {
        if (!doctorId) {
            throw new Error('Doctor ID is required');
        }
        return doctorModel.getDoctorById(doctorId);
    }

    async createDoctor(doctorData) {
        if (!doctorData || !doctorData.name || !doctorData.specialty || !doctorData.phone || !doctorData.email) {
            throw new Error('All fields are required');
        }
        if (await doctorModel.getDoctorById(doctorData.id)) {
            throw new Error('Doctor with this ID already exists');
        }
        return doctorModel.createDoctor(doctorData);
    }

    async updateDoctor(doctorId, doctorData) {
        if (!doctorId || !doctorData) {
            throw new Error('Doctor ID and data are required');
        }
        if (!doctorData.name || !doctorData.specialty || !doctorData.phone || !doctorData.email) {
            throw new Error('All fields are required');
        }
        const existingDoctor = await doctorModel.getDoctorById(doctorId);
        if (!existingDoctor) {
            throw new Error('Doctor not found');
        }
        if (existingDoctor.id !== doctorData.id) {
            throw new Error('Cannot change doctor ID');
        }
        return doctorModel.updateDoctor(doctorId, doctorData);
    }

    async deleteDoctor(doctorId) {
        return doctorModel.deleteDoctor(doctorId);
    }
}

export default new DoctorService();
