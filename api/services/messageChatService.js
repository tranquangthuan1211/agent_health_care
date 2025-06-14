import MessagesChatModel from "../models/messageChatModel.js";
class MessagesChatService {
  
    static async createHistoryChat(userId, message, type) {
        if (!userId || !message || !type) {
            throw new Error("User ID, message, and type are required to create a history chat.");
        }
        return await MessagesChatModel.createHistoryChat(userId, message, type);
    }
    
    static async getHistoryChatsByUserId(userId) {
        if (!userId) {
            throw new Error("User ID is required to retrieve history chats.");
        }
        return await MessagesChatModel.getHistoryChatsByUserId(userId);
    }
    
    static async deleteHistoryChat(chatId) {
        if (!chatId) {
            throw new Error("Chat ID is required to delete a history chat.");
        }
        return await MessagesChatModel.deleteHistoryChat(chatId);
    }
}

export default MessagesChatService;