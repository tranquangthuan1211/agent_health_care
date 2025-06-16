import 'dotenv/config';
import amqp from 'amqplib';

const EXCHANGE = 'chatbot_exchange';
const QUEUE_NAME = 'emailQueue';
const ROUTING_KEY = 'chatbot.request';

class Consumer {
    constructor(url, method) {
        this.exchange = EXCHANGE;
        this.queue = QUEUE_NAME;
        this.routingKey = ROUTING_KEY;
        this.connection = null;
        this.channel = null;
        this.url = url;
        this.method = method;
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
                    const response = await fetch(this.url, {
                            method: this.method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: messageContent.userId,
                                message: messageContent.message,
                                type: messageContent.type,
                            }),
                        });

                        if (!response.ok) {
                            throw new Error(`API error: ${response.status}`);
                        }

                        const result = await response.json();
                        console.log('API response:', result);

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
export default Consumer;