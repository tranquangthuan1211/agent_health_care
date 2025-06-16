import consumerRabbit from "./config/consumer-rabbit.js";

console.log("Starting RabbitMQ consumer...");
(async () => {
    try {
        const newConsumer = new consumerRabbit(
            'http://localhost:8080/api/chat',
            'POST'
        );
        await newConsumer.start();
    } catch (err) {
        console.error('RabbitMQ consumer init failed. Exiting...');
        process.exit(1);
    }
})();
