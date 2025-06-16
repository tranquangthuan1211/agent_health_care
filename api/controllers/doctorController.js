
import doctorService from "../services/doctorService.js";
class DoctorController {
    async getDoctors(req, res) {
        try {
            const doctors = await doctorService.getAllDoctors();
            res.status(200).json(doctors);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new DoctorController();