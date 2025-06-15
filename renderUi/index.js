// index.js
import 'dotenv/config';
import express from 'express';
import rabbitMQ from './config/rabbitMq.js'; // Import class RabbitMQ đã export sẵn

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

(async () => {
    try {
        await rabbitMQ.connect();
    } catch (err) {
        console.error('RabbitMQ init failed. Exiting...');
        process.exit(1);
    }
})();

// Route test API để publish message
app.post('/send-message', async (req, res) => {
    const { type, userId, message } = req.body;

    if (!type || !userId || !message) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const payload = { type, userId, message };

    try {
        await rabbitMQ.publish('email.send', payload); // Thay routingKey theo logic của bạn
        res.status(200).json({ success: true, message: 'Message sent to RabbitMQ' });
    } catch (err) {
        console.error('Publish failed:', err);
        res.status(500).json({ success: false, error: 'Failed to publish message' });
    }
});

// Đóng kết nối RabbitMQ khi app dừng
process.on('SIGINT', async () => {
    console.log('\nGracefully shutting down...');
    await rabbitMQ.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
