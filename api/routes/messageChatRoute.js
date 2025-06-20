import messageController from "../controllers/messageController.js";
import express from "express";
const router = express.Router();

function useMessageChatRoute(){
    router.get("/:userId", messageController.getHistoryChatsByUserId);
    

    router.post("/", messageController.createHistoryChat);
    
    // // Route to delete a message by ID
    // router.delete("/:messageId", messageController.deleteMessage);
    
    return router;
}
export default useMessageChatRoute;