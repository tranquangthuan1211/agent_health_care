import diseasesController from "../controllers/diseasesController.js";
import express from "express";
const router = express.Router();
function useRouteDisease() {
    // Get all diseases
    router.get("/", diseasesController.getDiseases);

    return router;
}
export default useRouteDisease;