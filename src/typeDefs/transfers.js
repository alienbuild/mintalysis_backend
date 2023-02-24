import gql from 'graphql-tag'

export const typeDefs = gql`

    type Subscription { 
        createVeveTransfer: [VeveTransfer]
    }

`

export default typeDefs