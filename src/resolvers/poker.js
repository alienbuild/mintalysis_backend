import {GraphQLError} from "graphql";
import {participantPopulated} from "./conversations.js";
import {Player, Table} from "@chevtek/poker-engine"
import {exclude} from "../utils/index.js";
import {withFilter} from "graphql-subscriptions";

const resolvers = {
    Query: {
        getPokerTable: async (_, { pokerTableId }, { prisma }) => {

            try {

                const table = await prisma.poker_table.findUnique({
                    where: {
                        id: pokerTableId
                    },
                    include: {
                        participants: {
                            include: participantPopulated
                        },
                        latest_message: {
                            include: {
                                sender: {
                                    select: {
                                        id: true,
                                        username: true
                                    }
                                }
                            }
                        },
                        poker_table_pots: true
                    }
                })

                return exclude(table, ['deck'])
            } catch (e) {
                throw new GraphQLError('Failed to get poker table.')
            }

        }
    },
    Mutation: {
        createPokerTable: async (_, { participantIds, seat }, { userInfo, prisma, pubsub }) => {

            if (!userInfo) throw new GraphQLError('Not authorised')
            const { userId } = userInfo

            try {

                const table = await prisma.poker_table.create({
                    data: {
                        host_id: userId,
                        participants: {
                            create: {
                                user_id: userId,
                                has_seen_latest_message: true,
                                seat: seat,
                                show_cards: false
                            }
                            // createMany: {
                            //     data: participantIds.map(id => ({
                            //         user_id: id,
                            //         has_seen_latest_message: id === userId
                            //     }))
                            // }
                        },
                        poker_table_pots: {
                            create: {
                                amount: 0,
                            }
                        }
                    },
                    include: {
                        participants: {
                            include: participantPopulated
                        },
                        latest_message: {
                            include: {
                                sender: {
                                    select: {
                                        id: true,
                                        username: true
                                    }
                                }
                            }
                        }
                    }
                })

                pubsub.publish('POKER_TABLE_CREATED', {
                    pokerTableCreated: table
                })

                return {
                    pokerTableId: table.id
                }

            } catch (e) {
                console.log('Failed create: ', e)
                throw new GraphQLError('Error creating poker table.', e)
            }

        },
        startPokerTable: async (_, { pokerTableId }, { userInfo, prisma, pubsub }) => {
            if (!userInfo) throw new GraphQLError('Please login to continue')

            try {
                const tableInit = await initPokerTable(prisma, pubsub, pokerTableId)
                if (tableInit.status === 'IN_PROGRESS') throw new GraphQLError('Game has already started.')
                // if (tableInit.host_id !== userInfo.userId) throw new GraphQLError('Only the host can start this game.')
                await tableInit.table.dealCards()

                tableInit.table.players.map(player => {
                    player.holeCards.map(playerCard => {
                        playerCard.hex = playerCard.color
                        playerCard.char = playerCard.suitChar
                    })
                })

                const table = await getPokerTable(pokerTableId, prisma)
                const vettedTable = await vetPokerTable(table, userInfo)
                pubsub.publish('POKER_TABLE_UPDATED', {
                    pokerTableUpdated: vettedTable
                })

                await prisma.$transaction([
                    ...tableInit.table.players.map((player) => (
                        prisma.poker_table_participant.update({
                            where: { id: player.id },
                            data: { hole_cards: player.holeCards }
                        })
                    )),
                    prisma.poker_table.update({
                        where: {
                            id: pokerTableId
                        },
                        data: {
                            // status: "IN_PROGRESS",
                            deck: tableInit.table.deck,
                            current_round: tableInit.table.currentRound,
                            current_bet: tableInit.table.currentBet,
                            current_position: tableInit.table.currentPosition,
                            last_position: tableInit.table.lastPosition,
                        }
                    })
                ])

                return true

            } catch (e) {
                console.log('Failed to start poker game: ', e)
                throw new GraphQLError('Failed to start poker game.')
            }

        },
        sitPlayerAtPokerTable: async (_, { pokerTableId, seat }, { userInfo, prisma, pubsub }) => {
            if (!userInfo) throw new GraphQLError('Please log in to continue.')
            const { userId } = userInfo

            try {

                await prisma.poker_table.update({
                    where: {
                        id: pokerTableId
                    },
                    data: {
                        participants: {
                            create: {
                                user_id: userId,
                                seat: seat,
                                left: false,
                                has_seen_latest_message: true,
                            }
                        }
                    }
                })

                const table = await getPokerTable(pokerTableId, prisma)
                const vettedTable = await vetPokerTable(table, userInfo)
                pubsub.publish('POKER_TABLE_UPDATED', {
                    pokerTableUpdated: vettedTable
                })

                return true

            } catch (e) {
                console.log('Error seating player: ', e)
                throw new GraphQLError('Failed to seat player.')
            }

        },
        standPlayerAtPokerTable: async (_, { pokerTableId, participantId }, { userInfo, prisma, pubsub }) => {
            if (!userInfo) throw new GraphQLError('Please log in to continue.')

            try {

                await prisma.poker_table_participant.update({
                    where: {
                        id: participantId
                    },
                    data: {
                        left: true
                    }
                })

                const table = await getPokerTable(pokerTableId, prisma)
                const vettedTable = await vetPokerTable(table, userInfo)
                pubsub.publish('POKER_TABLE_UPDATED', {
                    pokerTableUpdated: vettedTable
                })

                return true

            } catch (e) {
                console.log('Error standing player: ', e)
                throw new GraphQLError('Failed to stand player.')
            }

        }
    },
    Subscription: {
        pokerTableUpdated: {
            subscribe: withFilter(
                (_, __, { pubsub }) => pubsub.asyncIterator(['POKER_TABLE_UPDATED']),
                (payload, { pokerTableId }, { userInfo }) => {
                    return payload.pokerTableUpdated.id === pokerTableId
                }
            )
        }
    }

}

const vetPokerTable = async (table, userInfo) => {
    await table.participants.map((particiant) => {
        if (particiant.user.id !== userInfo.userId){
            particiant.holeCards = null
        }
    })

    return table
}

const getPokerTable = async (pokerTableId, prisma) => {
    try {

        return await prisma.poker_table.findUnique({
            where:{
                id: pokerTableId
            },
            include: {
                participants: {
                    include: participantPopulated
                },
                latest_message: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                },
                poker_table_pots: true
            }
        })

    } catch (e) {
        console.log('Unable to get poker table.')
        throw new GraphQLError('Unable to retrieve the poker table.')
    }
}

const initPokerTable = async (prisma, pubsub, pokerTableId) => {

    try {
        const pokerTable = await prisma.poker_table.findUnique({
            where: {
                id: pokerTableId
            },
            include: {
                participants: {
                    include: participantPopulated
                },
                latest_message: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                },
                poker_table_pots: true
            }
        })

        const table = new Table()
        table.id = pokerTableId
        table.deck = pokerTable.deck
        table.handNumber = pokerTable.hand_number
        table.dealerPosition = 0
        table.smallBlindPosition = 1
        table.bigBlindPosition = 2
        table.players = [
            null, null, null,
            null, null, null,
            null, null, null,
            null
        ]
        pokerTable.participants.map((player) => {
            const newPlayer = new Player()
            newPlayer.id = player.id
            newPlayer.user_id = player.user_id
            newPlayer.stackSize = player.stack_size
            newPlayer.bet = player.bet
            newPlayer.table = table
            newPlayer.folded = player.folded
            newPlayer.showCards = player.show_cards
            newPlayer.left = player.left
            newPlayer.holeCards = player.hole_cards
            newPlayer.has_seen_latest_message = pokerTable.has_seen_latest_message
            newPlayer.user = player.user

            return table.players[player.seat - 1] = newPlayer

        })
        table.pots = [{ amount: pokerTable.poker_table_pots[0].amount, eligiblePlayers: pokerTable.poker_table_pots[0].eligible_players }]

        return {
            status: pokerTable.status,
            table: table
        }

    } catch (e) {
        console.log('Error getting poker table data', e)
    }

}

export default resolvers
