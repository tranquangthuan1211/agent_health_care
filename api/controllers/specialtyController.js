import specialtyServices from "../services/specialtyServices.js";

class SpecialtyController {
    async getSpecialties(req, res) {
        try {
            const specialties = await specialtyServices.getAllSpecialties();
            res.status(200).json(specialties);
        } catch (error) {
            console.error('Error fetching specialties:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getSpecialtyById(req, res) {
        const { specialtyId } = req.params;
        try {
            const specialty = await specialtyServices.getSpecialtyById(specialtyId);
            if (!specialty) {
                return res.status(404).json({ error: 'Specialty not found' });
            }
            res.status(200).json(specialty);
        } catch (error) {
            console.error('Error fetching specialty:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
export default new SpecialtyController();