import { makeExecutableSchema } from "@graphql-tools/schema";
import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import { PubSub } from "graphql-subscriptions";
import { useServer } from "graphql-ws/lib/use/ws";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import typeDefs from './typeDefs/index.js'
import resolvers from "./resolvers/index.js"
import * as dotenv from "dotenv";
import cors from "cors";
import pkg from 'body-parser';
const { json } = pkg;
import { getUserFromToken } from "./utils/getUserFromToken.js"
import mongoose from "mongoose"
import {scheduledDailyJobs, scheduledHourlyJobs} from "../services/alice/index.js";
import {scheduledRapidJobs, scheduledLiveJobs} from "../services/cronJobs.js";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

export const prisma = new PrismaClient();
export const pubsub = new PubSub();

const main = async () => {
    dotenv.config();

    // Create the schema, which will be used separately by ApolloServer and
    // the WebSocket server.
    const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
    });

    // Create an Express app and HTTP server; we will attach both the WebSocket
    // server and the ApolloServer to this HTTP server.
    const app = express();
    const httpServer = createServer(app);

    // Create our WebSocket server using the HTTP server we just set up.
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: "/graphql/subscriptions",
    });

    const identifyFn = context => {
        return context.request.ip
    }
    // Context parameters

    const getSubscriptionContext = async ( ctx ) => {
        // ctx is the graphql-ws Context where connectionParams live
        if (ctx.connectionParams && ctx.connectionParams.authorization) {
            const { authorization } = ctx.connectionParams;
            const userInfo = await getUserFromToken(authorization)
            return { userInfo, prisma, pubsub };
        }
        // Otherwise let our resolvers know we don't have a current user
        return { userInfo: null, prisma, pubsub };
    };

    // Save the returned server's info so we can shutdown this server later
    const serverCleanup = useServer(
        {
            schema,
            context: (ctx) => {
                // This will be run every time the client sends a subscription request
                // Returning an object will add that information to our
                // GraphQL context, which all of our resolvers have access to.
                return getSubscriptionContext(ctx);
            },
        },
        wsServer
    );
    // Set up ApolloServer.
    const server = new ApolloServer({
        schema,
        csrfPrevention: true,
        plugins: [
            // Proper shutdown for the HTTP server.
            ApolloServerPluginDrainHttpServer({ httpServer }),

            // Proper shutdown for the WebSocket server.
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
    });
    await server.start();

    const corsOptions = {
        methods: ['GET', 'POST', 'OPTIONS'],
        origin: [process.env.BASE_URL, '67.225.248.251', '81.136.110.55', 'http://localhost:3002'],
        credentials: true,
    };

    app.use(
        "/graphql",
        cors(corsOptions),
        json(),
        graphqlUploadExpress({
            maxFileSize: 30000000,
            maxFiles: 20,
        }),
        expressMiddleware(server, {
            context: async ({ req }) => {
                const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress
                const userAgent = req.headers["user-agent"]
                const userInfo = await getUserFromToken(req.headers.authorization)
                return { ipAddress, userAgent, userInfo, prisma, pubsub };
            },
        })
    );
    // server.applyMiddleware({ app, path: "/graphql", cors: corsOptions });

    // MongoDB Database
    mongoose.connect(process.env.MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to MongoDB'))
        .catch((e) => console.log('Error connecting to MongoDB', e))

    const PORT = process.env.PORT || 8001

    // Now that our HTTP server is fully set up, we can listen to it.
    await new Promise((resolve) =>
            httpServer.listen(PORT, () => {
                // scheduledRapidJobs()
                scheduledHourlyJobs()
                scheduledDailyJobs()
                // scheduledLiveJobs()
                resolve()
            })
    );
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);

};

main()
