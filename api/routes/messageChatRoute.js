import messageController from "../controllers/messageController.js";
import express from "express";
const router = express.Router();

function useMessageChatRoute(){
    router.get("/:chatId", messageController.getHistoryChatsByUserId);
    

    router.post("/chat", messageController.createHistoryChat);
    
    // // Route to delete a message by ID
    // router.delete("/:messageId", messageController.deleteMessage);
    
    return router;
}
export default useMessageChatRoute;