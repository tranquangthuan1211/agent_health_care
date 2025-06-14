import 'dotenv/config';
import express from 'express';
import amqp from 'amqplib';
import healthCareAI from './llm-model.js';

const EXCHANGE = 'chatbot_exchange';
const QUEUE_NAME = 'emailQueue';
const ROUTING_KEY = 'email.send';

class Consumer {
    constructor(exchange = EXCHANGE, queue = QUEUE_NAME, routingKey = ROUTING_KEY) {
        this.exchange = exchange;
        this.queue = queue;
        this.routingKey = routingKey;
        this.connection = null;
        this.channel = null;
    }

    async start() {
        try {
            this.connection = await amqp.connect(process.env.RABBITMQ_URI);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
            await this.channel.assertQueue(this.queue, { durable: true });
            await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);

            console.log('Consumer is waiting for messages...');

            this.channel.consume(this.queue, async (msg) => {
                if (msg !== null) {
                    const messageContent = JSON.parse(msg.content.toString());

                    console.log('Received message:', messageContent);
                    console.log(`Processing health query from: ${messageContent.userId}`);
                    console.log("type:", messageContent.type);

                    

                    this.channel.ack(msg);
                }
            });
        } catch (error) {
            console.error('Consumer error:', error);
        }
    }

    async close() {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
        } catch (error) {
            console.error('Error closing RabbitMQ connection:', error);
        }
    }
}
export default new Consumer();