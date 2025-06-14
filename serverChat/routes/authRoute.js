import express from "express";
import authController from "../controllers/authController.js";
const router = express.Router();

function useRouteAuth() {
    // Define routes for authentication operations
    router.post("/login", authController.login);
    router.post("/register", authController.register);
    // router.get("/logout", authController.logout);
    // router.get("/profile", authController.getProfile);

    return router;
}
export default useRouteAuth;