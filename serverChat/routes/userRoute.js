import express from "express";
import userController from "../controllers/userController.js"; // Adjust the path as necessary
const router = express.Router();

function userRoute() {
    // Define routes for user operations
    router.post("/register", userController.createUser);

    return router;
}

export default userRoute;