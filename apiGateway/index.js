import consumerRabbit from "./config/consumer-rabbit.js";

console.log("Starting RabbitMQ consumer...");
(async () => {
    try {
        await consumerRabbit.start();
    } catch (err) {
        console.error('RabbitMQ consumer init failed. Exiting...');
        process.exit(1);
    }
})();
