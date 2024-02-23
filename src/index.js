import express from "express";
import { createServer } from "http";
import { ApolloServer } from "@apollo/server";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import mongoose from "mongoose";
import cors from "cors";
import pkg from 'body-parser';
const { json } = pkg;
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import userRoutes from './routes/userRoutes.js';
import typeDefs from './typeDefs/index.js'
import resolvers from "./resolvers/index.js"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import {expressMiddleware} from "@apollo/server/express4";
import {getUserFromToken} from "./utils/getUserFromToken.js";
import {CONFIG} from "./config.js";
import {lastSeenMiddleware} from "./middlewares.js";
import {prisma, pubsub, slack} from "./services.js";
import {createContext} from "./context.js";
import {validateStripeWebhook} from "../webhooks/stripe.js";
import {rewardfulWebHook} from "../webhooks/rewardful.js";

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
                    slack,
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
            context: createContext
        })
    );

    app.post("/webhooks/stripe", express.raw({ type: "application/json" }), validateStripeWebhook);

    app.post("/webhooks/rewardful", express.json(), rewardfulWebHook);

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
