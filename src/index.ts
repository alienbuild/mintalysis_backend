import { ApolloServer, gql } from 'apollo-server'
import { typeDefs } from "./schema"
import { Query } from "./resolvers"
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export interface Context {
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>
}

const server = new ApolloServer({
    typeDefs,
    resolvers: {
        Query
    },
    context: {
        prisma
    }
})

server.listen()
    .then(({url}) => {
        console.log(`Server ready on ${url}`)
    })
    .catch(err => console.log('Error starting server. ', err))