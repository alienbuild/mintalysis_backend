import gql from 'graphql-tag'

export const typeDefs = gql`

    type Mutation {
        triggerImxTransfer: Boolean
        triggerImxMint: Boolean
    }

`

export default typeDefs