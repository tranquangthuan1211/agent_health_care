
import healthCareAI from '../config/llm-model.js';
import rabbitMq from '../config/rabbitMq.js';
import RabbitMQ from "../config/rabbitMq.js"
class ChatController {
    async index(req, res) {
        res.send("hello from chatController");
    }
    async chatWithAI(req, res) {
        try {
            const { message, context, conversationHistory } = req.body;
            console.log("Received chat request:", { message, context, conversationHistory });
            if (!message) {
                return res.status(400).json({ 
                    error: 'Message is required' 
                });
            }
        
            console.log(`Received chat request: ${message}`);
            const routingKey = 'chatbot.request';
            await RabbitMQ.publish(routingKey, {
                message,
                userId: 1,
                type: "request"
            });


            if (healthCareAI.isEmergencyQuery(message)) {
                const emergencyResponse = healthCareAI.getEmergencyResponse();
                return res.json({
                    response: emergencyResponse.response,
                    isEmergency: true,
                    timestamp: new Date().toISOString()
                });
            }
        
            const result = await healthCareAI.processHealthQuery(message, context);
            console.log('AI response:', result.response);
            if (!result || !result.response) {
                return res.status(500).json({ 
                    error: 'Failed to get a valid response from AI' 
                });
            }
            rabbitMq.publish(routingKey, {
                message: result.response,
                userId: 1,
                type: "response"
            });
            res.json({
                response: result.response,
                success: result.success,
                usage: result.usage,
                timestamp: new Date().toISOString(),
                ...(result.error && { error: result.error })
            });
        
        } catch (error) {
            console.error('Chat endpoint error:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                response: 'I apologize, but I\'m having technical difficulties. Please try again or consult with a healthcare professional.'
            });
        }
    }
}
export default new ChatController();
