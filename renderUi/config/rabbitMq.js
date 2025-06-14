import 'dotenv/config';
import express from 'express';
import amqp from 'amqplib';

const app = express();
app.use(express.json());

const RABBITMQ_URL = process.env.RABBITMQ_URL || '';
const EXCHANGE = 'chatbot_exchange';

class RabbitMQ {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        try {
            this.connection = await amqp.connect(process.env.RABBITMQ_URI);
            this.channel = await this.connection.createChannel();
            await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
            console.log('Connected to RabbitMQ and exchange created.');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }

    async publish(routingKey, message) {
        if (!this.channel) {
            throw new Error('Channel is not initialized. Call connect() first.');
        }
        try {
            this.channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(message)));
            console.log('Message published:', routingKey, message);
        } catch (error) {
            console.error('Failed to publish message:', error);
            throw error;
        }
    }

    async getChannel() {
        if (!this.channel) {
            throw new Error('Channel is not initialized. Call connect() first.');
        }
        return this.channel;
    }

    async close() {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            console.log('RabbitMQ connection closed.');
        } catch (error) {
            console.error('Failed to close RabbitMQ connection:', error);
        }
    }
}

export default new RabbitMQ();
