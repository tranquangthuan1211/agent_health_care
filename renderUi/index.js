import express from 'express';
import Consumer from './config/rabbit-mq.js';
import healthCareAI from './config/llm-model.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public')); // For serving static files if needed

// Health care chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, context, conversationHistory } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required' 
            });
        }

        console.log(`Received chat request: ${message}`);

        // Check for emergency queries
        if (healthCareAI.isEmergencyQuery(message)) {
            const emergencyResponse = healthCareAI.getEmergencyResponse();
            return res.json({
                response: emergencyResponse.response,
                isEmergency: true,
                timestamp: new Date().toISOString()
            });
        }

        // Process with AI model
        const result = await healthCareAI.processHealthQuery(message, context);

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
});

// General chat endpoint (for non-healthcare queries)
app.post('/api/chat/general', async (req, res) => {
    try {
        const { message, conversationHistory } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required' 
            });
        }

        const result = await healthCareAI.generateResponse(message, conversationHistory);

        res.json({
            response: result.response,
            success: result.success,
            usage: result.usage,
            timestamp: new Date().toISOString(),
            ...(result.error && { error: result.error })
        });

    } catch (error) {
        console.error('General chat endpoint error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            response: 'I apologize, but I\'m having technical difficulties. Please try again later.'
        });
    }
});

// Root route to serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile('/public/index.html', { root: '.' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Healthcare AI Agent'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Healthcare AI Agent server running on port ${PORT}`);
    console.log(`Chat endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Start RabbitMQ consumer
Consumer.start();