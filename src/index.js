import express from 'express'
import { createServer } from 'http'
import { makeExecutableSchema } from "@graphql-tools/schema"
import { SubscriptionServer } from "subscriptions-transport-ws"
import { execute, subscribe } from "graphql"
import { ApolloServer } from "apollo-server-express"
import { PrismaClient } from "@prisma/client"
import { typeDefs } from './resolvers/schema.js'
import { getUserFromToken } from './utils/getUserFromToken.js'
import {
    Mutation,
    Query,
    Subscription,
    Post,
    Profile,
    User
} from "./resolvers/index.js"
import {PubSub} from "graphql-subscriptions"

const prisma = new PrismaClient();
export const pubsub = new PubSub();

(async function() {

    const app = express();
    const httpServer = createServer(app);

    const schema = makeExecutableSchema({
        typeDefs,
        resolvers: {
            Query,
            Mutation,
            Subscription,
            Profile,
            Post,
            User,
        }
    });

    const subscriptionServer = SubscriptionServer.create(
        {
            schema,
            execute,
            subscribe
        },
        { server: httpServer, path: '/graphql' }
    );

    const server = new ApolloServer({
        schema,
        context: async ({ req }) => {
            const userInfo = await getUserFromToken(req.headers.authorization)
            return {
                prisma,
                userInfo,
            }
        },
        plugins: [
            {
                async serverWillStart(){
                    return {
                        async drainServer(){
                            subscriptionServer.close();
                        }
                    }
                }
            }
        ]
    });

    await server.start();
    server.applyMiddleware({ app });

    const PORT = 4000;
    httpServer.listen(PORT, () => {
           console.log(`🚀 Server ready`);
    });

})();