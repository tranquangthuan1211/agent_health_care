import diseaseService from "../services/diseaseService.js";

class DiseaseController {
    async getDiseases(req, res) {
        try {
            const diseases = await diseaseService.getAllDiseases();
            res.status(200).json(diseases);
        } catch (error) {
            console.error('Error fetching diseases:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
export default new DiseaseController();