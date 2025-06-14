import 'dotenv/config';
import express from "express";

const PORT = process.env.PORT || 3000;

console.log('Starting simple test server...');
console.log('Environment check:');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY?.substring(0,20) + '...');
console.log('- OPENAI_API_ENDPOINT:', process.env.OPENAI_API_ENDPOINT);

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        message: 'Healthcare AI Server is running!',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.post('/api/chat', (req, res) => {
    const { question } = req.body;
    res.json({
        code: 200,
        message: "Test response",
        data: {
            question: question,
            response: "Server is working! This is a test response.",
            timestamp: new Date().toISOString()
        }
    });
});

app.listen(PORT, () => {
    console.log(` Healthcare AI Server is running on http://localhost:${PORT}`);
    console.log(` Test endpoint: http://localhost:${PORT}/api/chat`);
});
