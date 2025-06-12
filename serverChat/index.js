import express from 'express';
import interfaceRoute from './routes/index.js';
import useRouteChat from './routes/chatRoute.js';
import userRoute from './routes/userRoute.js';
import useRouteAuth from './routes/authRoute.js';
import rabbitmq from "./config/rabbitMq.js"; 
import { initDatabase } from './config/db-config.js';
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public')); // For serving static files if needed

app.use('/', interfaceRoute());
app.use('/api', useRouteChat());
app.use('/api',userRoute());
app.use('/api', useRouteAuth());

const startServer = async () => {
    try {
        await initDatabase(); // Initialize database tables
        await rabbitmq.connect(); // kết nối RabbitMQ
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

// // Start RabbitMQ consumer
// Consumer.start();