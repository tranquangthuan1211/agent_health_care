import specialtyController from "../controllers/specialtyController.js";
import express from "express";
const router = express.Router();
function useRouteSpecialty() {
    // Get all specialties
    router.get("/", specialtyController.getSpecialties);


    return router;
}
export default useRouteSpecialty;