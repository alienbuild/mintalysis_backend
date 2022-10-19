const { ApolloServer } = require('apollo-server')
const { typeDefs } = require('./schema')
const { Query } = require('./resolvers/Query')
const { Brand } = require('./resolvers/Brand')
const { Collectible } = require('./resolvers/Collectible')
const { collectibles, brands } = require("./dummy")

const server = new ApolloServer({
    typeDefs,
    resolvers: {
        Query,
        Brand,
        Collectible
    },
    context: {
        brands,
        collectibles
    }
})

server.listen()
    .then(({ url }) => {
        console.log(`Server is ready at ${url}`)
    })