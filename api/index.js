import express from 'express';
import userRoute from './routes/userRoute.js';
import useMessageChatRoute from './routes/messageChatRoute.js';
import useRouteDoctor from './routes/doctorRoute.js';
import { initDatabase } from './config/db-config.js';
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static('public')); // For serving static files if needed

app.use('/api',userRoute());
app.use('/api', useRouteDoctor());
app.use('/api', useMessageChatRoute());

const startServer = async () => {
    try {
        // await initDatabase(); // Initialize database tables
        // console.log('Database initialized successfully');
        // await rabbitmq.connect(); // kết nối RabbitMQ
        console.log('RabbitMQ connection disabled for testing');
        
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();