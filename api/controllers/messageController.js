import MessagesChatService from "../services/messageChatService.js";
class MessageController {
    async createHistoryChat(req, res) {
        try {
            const { userId, message,type } = req.body;
            const chat = await MessagesChatService.createHistoryChat(userId, message,type);
            res.status(201).json(chat);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getHistoryChatsByUserId(req, res) {
        try {
            const { userId } = req.params;
            const chats = await MessagesChatService.getHistoryChatsByUserId(userId);
            res.status(200).json(chats);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // async deleteHistoryChat(req, res) {
    //     try {
    //         const { chatId } = req.params;
    //         await MessagesChatService.deleteHistoryChat(chatId);
    //         res.status(204).send();
    //     } catch (error) {
    //         res.status(400).json({ error: error.message });
    //     }
    // }
}
export default new MessageController();