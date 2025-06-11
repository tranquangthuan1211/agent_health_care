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
                    console.log(`Processing health query from: ${messageContent.to}`);
                    console.log(`Subject: ${messageContent.subject}`);
                    console.log(`Query: ${messageContent.body}`);

                    try {
                        // Check if this is an emergency query
                        if (healthCareAI.isEmergencyQuery(messageContent.body)) {
                            const emergencyResponse = healthCareAI.getEmergencyResponse();
                            console.log('Emergency detected - sending emergency response');
                            console.log('Response:', emergencyResponse.response);
                        } else {
                            // Process regular health query with AI
                            console.log('Processing with AI model...');
                            const aiResult = await healthCareAI.processHealthQuery(
                                messageContent.body,
                                {
                                    // Extract any additional context from the message
                                    symptoms: messageContent.symptoms,
                                    age: messageContent.age,
                                    gender: messageContent.gender,
                                    medications: messageContent.medications
                                }
                            );

                            if (aiResult.success) {
                                console.log('AI Response:', aiResult.response);
                                if (aiResult.usage) {
                                    console.log('Token usage:', aiResult.usage);
                                }
                            } else {
                                console.error('AI processing failed:', aiResult.error);
                                console.log('Fallback response:', aiResult.response);
                            }
                        }
                    } catch (error) {
                        console.error('Error processing health query:', error);
                        console.log('Sending fallback response due to processing error');
                    }

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