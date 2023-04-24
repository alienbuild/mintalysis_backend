import gql from "graphql-tag"

const typeDefs = gql`
    
    type Query {
        getPokerTable(pokerTableId: ID!) : PokerTable
    }
    
    type Mutation {
        createPokerTable(participantIds: [String]) : CreatePokerTableResponse
        startPokerTable(pokerTableId: ID!): Boolean 
    }
    
    type Subscription {
        pokerTableUpdated: PokerTableUpdatedPayload
    }
    
    type PokerTableUpdatedPayload {
        status: String
        buyIn: Int
        communityCards: [PlayingCard]
        handNumber: Int
        players: [PokerParticipant]
        pots: [Pot]
        dealerPosition: Int
        smallBlindPosition: Int
        bigBlindPosition: Int
        currentRound: String
        currentPosition: Int
        lastPosition: Int
    }
    
    type PlayingCard {
        id: String
    }
    
    type Pot {
        amount: Int
        eligiblePlayers: [User]
    }
    
    type PokerTable {
        id: String
        round: Int
        status: String
        pot: Int
        participants: [PokerParticipant]
    }
    
    type PokerParticipant {
        id: String
        stackSize: Int
        bet: Int
        folded: Boolean
        showCards: Boolean
        left: Boolean
        holeCards: [PlayingCard]
        seat: Int
        has_seen_latest_message: Boolean
        updatedAt: DateTime
        user: User
    }

    type CreatePokerTableResponse {
        pokerTableId: String
    }
    
`

export default typeDefs