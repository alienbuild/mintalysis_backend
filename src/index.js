import dotenv from 'dotenv';

const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: envPath });

(async () => {

    const express = (await import('express')).default;
    const { createServer } = await import('http');
    const { ApolloServer } = await import('@apollo/server');
    const { WebSocketServer } = await import('ws');
    const { useServer } = await import('graphql-ws/lib/use/ws');
    const { makeExecutableSchema } = await import('@graphql-tools/schema');
    const cors = (await import('cors')).default;
    const bodyParser = (await import('body-parser')).default;
    const graphqlUploadExpress = (await import('graphql-upload/graphqlUploadExpress.mjs')).default;
    const { ApolloServerPluginDrainHttpServer } = await import('@apollo/server/plugin/drainHttpServer');
    const { expressMiddleware } = await import('@apollo/server/express4');

    const userRoutes = (await import('./routes/userRoutes.js')).default;
    const typeDefs = (await import('./typeDefs/index.js')).default;
    const resolvers = (await import('./resolvers/index.js')).default;
    const { getUserFromToken } = await import('./utils/getUserFromToken.js');
    const { CONFIG } = await import('./config.js');
    const { lastSeenMiddleware } = await import('./middlewares.js');
    const { prisma, pubsub, slack } = await import('./services.js');
    const { createContext } = await import('./context.js');
    const { validateStripeWebhook } = await import('../webhooks/stripe.js');
    const { rewardfulWebHook } = await import('../webhooks/rewardful.js');
    const mongoose = (await import('mongoose')).default;

    console.log('Environment variables loaded, starting application...');

    const initializeMongoose = async () => {
        try {
            await mongoose.connect(CONFIG.MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true });
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    };

    const main = async () => {
        console.log('Starting main application logic...');
        await initializeMongoose();

        const schema = makeExecutableSchema({ typeDefs, resolvers });
        const app = express();

        app.use(lastSeenMiddleware);
        app.use(userRoutes);
        app.use(cors(CONFIG.CORS_OPTIONS), bodyParser.json(), graphqlUploadExpress({ maxFileSize: 30000000, maxFiles: 20 }));

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

        const serverCleanup = useServer({
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
            onDisconnect: async (ctx) => {
                const { userInfo } = await getSubscriptionContext(ctx);
                if (userInfo && userInfo.id) {
                    await prisma.User.update({
                        where: { id: userInfo.id },
                        data: { status: 'OFFLINE' }
                    });
                }
            },
            context: async (ctx) => createContext()
        }, wsServer);

        const server = new ApolloServer({
            schema,
            plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            }],
        });

        await server.start();
        app.use("/graphql", expressMiddleware(server, { context: createContext }));

        app.post("/webhooks/stripe", express.raw({ type: "application/json" }), validateStripeWebhook);
        app.post("/webhooks/rewardful", express.json(), rewardfulWebHook);

        await new Promise(resolve => httpServer.listen(CONFIG.PORT, () => resolve()));
        console.log(`Server is now running on http://localhost:${CONFIG.PORT}/graphql`);

    };

    main().catch((e) => console.error('Error during application initialization:', e));
})();
