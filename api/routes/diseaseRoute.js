import diseasesController from "../controllers/diseasesController.js";
import express from "express";
const router = express.Router();
function useRouteDisease() {
    // Get all diseases
    router.get("/", diseasesController.getDiseases);
    // Get disease by ID

    return router;
}
export default useRouteDisease;