const amqp = require('amqplib');
const Log = require('../../shared/models/Log.model');

/**
 * RABBITMQ LOG CONSUMER
 * Consume eventos de user-created, user-updated, user-deleted
 * y los persiste en MongoDB
 */

let channel = null;
let connection = null;

const EXCHANGE_NAME = 'user_events';
const QUEUE_NAME = 'log_queue';

/**
 * Conectar y comenzar a consumir
 */
async function startConsumer() {
  try {
    if (!process.env.RABBITMQ_URL) {
      console.warn('RABBITMQ_URL not configured, event consumer disabled');
      return false;
    }

    // Conectar
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Asegurar exchange
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    // Asegurar cola
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind a todos los eventos de usuario
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'user.*');

    console.log('RabbitMQ Consumer started, listening to user.* events');

    // Consumir mensajes
    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());

          await processEvent(content);

          channel.ack(msg);
        } catch (error) {
          console.error('Error processing event:', error);
          // Rechazar y reencolar
          channel.nack(msg, false, false);
        }
      }
    });

    // Handle errors
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      console.warn('RabbitMQ connection closed, attempting reconnect...');
      setTimeout(startConsumer, 5000);
    });

    return true;
  } catch (error) {
    console.error('Failed to start event consumer:', error.message);
    setTimeout(startConsumer, 5000);
    return false;
  }
}

/**
 * Procesar evento y crear log
 */
async function processEvent(event) {
  const { eventType, data, timestamp, service } = event;

  const logEntry = {
    requestId: data.requestId || 'event-consumer',
    serviceName: service || 'unknown',
    userID: data.id || data.documentId || 'SISTEMA',
    idType: data.idType || 'CC',
    userEmail: data.email || null,
    action: mapEventToAction(eventType),
    severity: 'info',
    data: data,
    httpMethod: null,
    httpStatus: null,
    endpoint: null,
    time: timestamp ? new Date(timestamp) : new Date(),
    environment: process.env.NODE_ENV || 'development',
  };

  const log = new Log(logEntry);
  await log.save();

  console.log(`Log created from event: ${eventType}`);
}

/**
 * Mapear tipo de evento a acción de log
 */
function mapEventToAction(eventType) {
  const mapping = {
    'user.created': 'Created',
    'user.updated': 'Modified',
    'user.deleted': 'Deleted',
  };
  return mapping[eventType] || eventType;
}

/**
 * Cerrar conexión
 */
async function stopConsumer() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('RabbitMQ consumer stopped');
  } catch (error) {
    console.error('Error stopping consumer:', error);
  }
}

module.exports = {
  startConsumer,
  stopConsumer,
};
