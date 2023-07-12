import gql from "graphql-tag"

const typeDefs = gql`
    
    type Query {
        getPokerTable(pokerTableId: ID!) : PokerTable
    }
    
    type Mutation {
        createPokerTable(participantIds: [String], seat: Int!) : CreatePokerTableResponse
        startPokerTable(pokerTableId: ID!): Boolean 
        sitPlayerAtPokerTable(pokerTableId: ID!, seat: Int!) : Boolean
        standPlayerAtPokerTable(pokerTableId: ID!, participantId: ID!) : Boolean
    }
    
    type Subscription {
        pokerTableUpdated(pokerTableId: ID!): PokerTable
    }
    
    type PokerTableUpdatedPayload {
        status: String
        buyIn: Int
        communityCards: [PlayingCard]
        handNumber: Int
        players: [PokerParticipant]
        poker_table_pots: [Pot]
        dealerPosition: Int
        smallBlindPosition: Int
        bigBlindPosition: Int
        currentRound: String
        currentPosition: Int
        lastPosition: Int
    }
    
    type PlayingCard {
        rank: String
        suit: String
        hex: String
        char: String
    }
    
    type Pot {
        amount: Int
        eligiblePlayers: [User]
    }
    
    type PokerTable {
        id: String
        buy_in: Int
        hand_number: Int
        current_round: String
        current_bet: Int
        current_position: Int
        last_position: Int
        status: String
        participants: [PokerParticipant]
        poker_table_pots: [Pot]
    }
    
    type PokerParticipant {
        id: String
        stack_size: Int
        bet: Int
        folded: Boolean
        show_cards: Boolean
        left: Boolean
        hole_cards: [PlayingCard]
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