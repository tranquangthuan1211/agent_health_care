import express from 'express';
import chatController from '../controllers/chatController.js';
const router = express.Router();

function useRouteChat(){
    router.get('/', chatController.index);
    router.post('/chat', chatController.chatWithAI);
    return router;
}
export default useRouteChat;