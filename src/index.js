import express from 'express'
import { createServer } from 'http'
import { makeExecutableSchema } from "@graphql-tools/schema"
import { SubscriptionServer } from "subscriptions-transport-ws"
import { execute, subscribe } from "graphql"
import { ApolloServer } from "apollo-server-express"
// import { shield } from "graphql-shield"
import { applyMiddleware } from "graphql-middleware"
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
import cors from "cors"
import helmet from "helmet"
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs"


const prisma = new PrismaClient();
export const pubsub = new PubSub();

(async function() {

    const app = express();
    const httpServer = createServer(app);

    app.use(express.json())
    app.use(express
        .urlencoded({extended:true}))
    app.use(cors())
    app.use(helmet({ contentSecurityPolicy:(process.env.NODE_ENV === 'production' ? undefined:false) }))
    app.use(graphqlUploadExpress({ maxFieldSize: 100000, maxFiles: 10 }))

    const schema = makeExecutableSchema({
        typeDefs,
        resolvers: {
            Query,
            Mutation,
            Subscription,
            Profile,
            Post,
            User,
        },
    });

    // const permissions = shield({
    //     Query: {},
    //     Mutation: {}
    // })
    // const schemaWithPermissions = applyMiddleware(schema, permissions)

    const subscriptionServer = SubscriptionServer.create(
        {
            // schemaWithPermissions,
            schema,
            execute,
            subscribe
        },
        { server: httpServer, path: '/graphql' }
    );

    const server = new ApolloServer({
        // schemaWithPermissions,
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