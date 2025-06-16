import express from "express";
import doctorController from "../controllers/doctorController.js";

const router = express.Router();

function useRouteDoctor() {
    // Get all doctors
    router.get("/doctors", doctorController.getDoctors);

    return router;
}

export default useRouteDoctor;
