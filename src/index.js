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
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import Slack from '@slack/bolt'

export const prisma = new PrismaClient()
export const pubsub = new PubSub();
export const slack = new Slack.App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN
})

const main = async () => {
    dotenv.config();

    const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
    });

    const app = express();
    const httpServer = createServer(app);

    const wsServer = new WebSocketServer({
        server: httpServer,
        path: "/graphql/subscriptions",
    });

    const identifyFn = context => {
        return context.request.ip
    }

    const getSubscriptionContext = async ( ctx ) => {
        if (ctx.connectionParams && ctx.connectionParams.authorization) {
            const { authorization } = ctx.connectionParams;
            const userInfo = await getUserFromToken(authorization)
            return { userInfo, prisma, pubsub, slack };
        }
        return { userInfo: null, prisma, pubsub, slack };
    };

    const serverCleanup = useServer(
        {
            schema,
            context: (ctx) => {
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
            ApolloServerPluginDrainHttpServer({ httpServer }),
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
        origin: [process.env.BASE_URL, '67.225.248.251', '81.136.110.55', 'http://localhost:3002', 'http://localhost:3000'],
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
                return { ipAddress, userAgent, userInfo, prisma, pubsub, slack };
            },
        })
    );

    mongoose.connect(process.env.MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to MongoDB'))
        .catch((e) => console.log('Error connecting to MongoDB', e))

    const PORT = process.env.PORT || 8001

    await new Promise((resolve) =>
            httpServer.listen(PORT, () => {
                scheduledHourlyJobs()
                scheduledDailyJobs()
                resolve()
            })
    );
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);
};

main()
    .then(() => {
        console.log('Server is waiting to do sometihng.')
    })
    .catch((e) => {
        console.log('Server failed to start. ', e)
    })
