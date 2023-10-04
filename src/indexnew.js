import express from "express";
import { createServer } from "http";
import { ApolloServer } from "@apollo/server";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import mongoose from "mongoose";
import cors from "cors";
import { json } from 'body-parser';
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

import { CONFIG } from "./config";
import { lastSeenMiddleware } from "./middlewares";
import { prisma, pubsub, slack } from "./services";
import userRoutes from './routes/userRoutes.js';
import typeDefs from './typeDefs';
import resolvers from "./resolvers";
import {ApolloServerPluginDrainHttpServer} from "@apollo/server/dist/esm/plugin/drainHttpServer/index.js";
import {expressMiddleware} from "@apollo/server/express4";
import {getUserFromToken} from "./utils/getUserFromToken.js";

const initializeMongoose = async () => {
    try {
        await mongoose.connect(CONFIG.MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log('Error connecting to MongoDB', error);
    }
};

const main = async () => {
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    const app = express();

    app.use(lastSeenMiddleware);
    app.use(userRoutes);
    app.use(cors(CONFIG.CORS_OPTIONS), json(), graphqlUploadExpress({ maxFileSize: 30000000, maxFiles: 20 }));

    const httpServer = createServer(app);

    const wsServer = new WebSocketServer({
        server: httpServer,
        path: "/graphql/subscriptions",
    });

    const serverCleanup = useServer(
        {
            schema,
            onConnect: async (ctx) => {
                const { userInfo } = await getSubscriptionContext(ctx);
                if (userInfo && userInfo.id) {
                    await prisma.User.update({
                        where: { id: userInfo.id },
                        data: { status: 'ONLINE' }
                    });
                }
                return { userInfo };
            },
            context: async (ctx) => {
                return {
                    ...ctx.connectionParams,
                    prisma,
                    pubsub,
                    slack
                };
            },
            onDisconnect: async (ctx) => {
                const { userInfo } = await getSubscriptionContext(ctx);
                if (userInfo && userInfo.id) {
                    await prisma.User.update({
                        where: { id: userInfo.id },
                        data: { status: 'OFFLINE' }
                    });
                }
            },
        },
        wsServer
    );

    const server = new ApolloServer({
        schema,
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

    app.use("/graphql",
        expressMiddleware(server, {
            context: async ({ req }) => {
                const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress
                const userAgent = req.headers["user-agent"]
                const userInfo = await getUserFromToken(req.headers.authorization)
                return { ipAddress, userAgent, userInfo, prisma, pubsub, slack };
            },
        })
    );

    await new Promise((resolve) =>
        httpServer.listen(CONFIG.PORT, () => {
            resolve();
        })
    );

    console.log(`Server is now running on http://localhost:${CONFIG.PORT}/graphql`);
};

initializeMongoose()
    .then(main)
    .catch((e) => console.log('Server failed to start.', e));
