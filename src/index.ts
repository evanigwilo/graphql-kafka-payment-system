// ensures that all necessary environment variables are defined after reading from .env
import dotenv from 'dotenv-safe';
dotenv.config({ allowEmptyValues: true });
// Apollo & Graphql
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import typeDefs from './typeDefs';
import resolvers from './resolvers';
// Kafka
import { Kafka, Partitioners } from 'kafkajs';
// Http
import { createServer } from 'http';
// Express
import express from 'express';
// Cors
import cors from 'cors';
// Middleware
import session from './middleware/session';
// Constants, Helpers & Types
import { mongoConnect } from './helpers';
import { QueryMutationContext } from './types';
import {
  API_VERSION,
  KAFKA_CLIENT_ID,
  KAFKA_CLUSTER_API_KEY,
  KAFKA_CLUSTER_API_SECRET,
  KAFKA_GROUP_ID,
  KAFKA_SERVER,
  paymentTopic,
  SERVER_PORT,
} from './constants';

const initializeExpressApp = () => {
  const app = express();

  // setup cors
  app.use(
    cors({
      credentials: true,
      origin: [`http://localhost:${SERVER_PORT}`, 'https://studio.apollographql.com'],
    }),
  );

  // middleware that parses json request
  app.use(express.json());

  // session for user authentication
  app.use(session);

  return app;
};

const initializeKafka = async () => {
  // initialize a new kafka client
  const kafka = new Kafka({
    clientId: KAFKA_CLIENT_ID,
    brokers: [KAFKA_SERVER],
    connectionTimeout: 3000,
    ssl: true,
    sasl: {
      mechanism: 'plain',
      username: KAFKA_CLUSTER_API_KEY,
      password: KAFKA_CLUSTER_API_SECRET,
    },
  });

  // create topic for message events
  const admin = kafka.admin();
  await admin.connect();
  const topics = await admin.listTopics();
  if (!topics.includes(paymentTopic)) {
    await admin.createTopics({
      topics: [
        {
          topic: paymentTopic,
          numPartitions: 2,
          replicationFactor: 3,
        },
      ],
      timeout: 3000,
    });
  }
  console.log(`Kafka: Topic created [${paymentTopic}]`);
  // disconnect admin
  await admin.disconnect();

  // initialize a producer to publish message
  const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });
  producer.on('producer.connect', async () => {
    console.log(`Kafka: Producer connected`);
  });
  producer.on('producer.disconnect', () => {
    console.log(`Kafka: Producer disconnected`);
  });
  producer.on('producer.network.request_timeout', (payload) => {
    console.log(`Kafka: Producer request timeout ${payload}`);
  });
  // connect the producer
  producer.connect();

  // initialize a consumer that listens to transaction events and logs them to the console.
  const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });
  await consumer.connect();
  await consumer.subscribe({ topic: paymentTopic, fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message: { value, timestamp } }) => {
      if (!value) {
        return;
      }
      console.log({
        message: JSON.parse(value.toString()),
        timestamp,
        topic,
        partition,
      });
    },
  });

  return { producer, consumer };
};

// Required logic for integrating with Express
const startApolloServer = async () => {
  // initialize kafka client
  const { producer } = await initializeKafka();

  // connect database server
  const paymentDb = await mongoConnect();
  console.log('Connected to MongoDB');

  // create express app
  const app = initializeExpressApp();

  // create http or https server
  const httpServer = createServer(app);

  // build schema from the provided type definitions and resolvers
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const apolloServer = new ApolloServer({
    schema,
    csrfPrevention: true, // Prevents CSRF mutation attack
    cache: 'bounded',
    // set exception.stacktrace error field  while developing and debugging your server
    debug: false,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // show playground
      ApolloServerPluginLandingPageLocalDefault({ embed: true, includeCookies: true }),
    ],
    context: ({ req, res }): QueryMutationContext => ({
      req,
      res,
      paymentDb,
      producer,
    }),
  });
  // More required logic for integrating with Express
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    // Optionally provide GraphQL endpoint
    path: API_VERSION,
    cors: false,
  });

  // Modified server startup
  await new Promise<void>((resolve) => httpServer.listen({ port: SERVER_PORT }, resolve));

  console.log(`🚀 Server ready at http://localhost:${SERVER_PORT}${API_VERSION}`);
};

startApolloServer();
