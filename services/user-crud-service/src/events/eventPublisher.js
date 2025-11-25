const amqp = require('amqplib');

/**
 * RABBITMQ EVENT PUBLISHER
 * Publica eventos a RabbitMQ para procesamiento asíncrono
 */

let channel = null;
let connection = null;

const EXCHANGE_NAME = 'user_events';
const EXCHANGE_TYPE = 'topic';

/**
 * Conectar a RabbitMQ
 */
async function connect() {
  try {
    if (!process.env.RABBITMQ_URL) {
      console.warn('RABBITMQ_URL not configured, events will not be published');
      return false;
    }

    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
      durable: true,
    });

    console.log('Connected to RabbitMQ');

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      console.warn('RabbitMQ connection closed');
    });

    return true;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error.message);
    return false;
  }
}

/**
 * Publicar evento
 */
async function publishEvent(eventType, data) {
  if (!channel) {
    console.warn('RabbitMQ not connected, cannot publish event');
    return false;
  }

  try {
    const routingKey = `user.${eventType}`;
    const message = JSON.stringify({
      eventType,
      data,
      timestamp: new Date().toISOString(),
      service: 'user-crud-service',
    });

    const published = channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(message),
      {
        persistent: true,
        contentType: 'application/json',
      }
    );

    if (published) {
      console.log(`Event published: ${routingKey}`);
      return true;
    } else {
      console.warn('Failed to publish event to RabbitMQ');
      return false;
    }
  } catch (error) {
    console.error('Error publishing event:', error);
    return false;
  }
}

/**
 * Cerrar conexión
 */
async function close() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
}

module.exports = {
  connect,
  publishEvent,
  close,
};
