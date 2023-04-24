import {GraphQLError} from "graphql";
import {participantPopulated} from "./conversations.js";
import {Player, Table} from "@chevtek/poker-engine"
import {exclude} from "../utils/index.js";

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
                console.log('unable to get poker table: ', e)
            }

        }
    },
    Mutation: {
        createPokerTable: async (_, { participantIds }, { userInfo, prisma, pubsub }) => {

            if (!userInfo) throw new GraphQLError('Not authorised')
            const { userId } = userInfo

            try {

                const table = await prisma.poker_table.create({
                    data: {
                        host_id: userId,
                        participants: {
                            createMany: {
                                data: participantIds.map(id => ({
                                    user_id: id,
                                    has_seen_latest_message: id === userId
                                }))
                            }
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
                throw new GraphQLError('Error creating poker table.', e)
            }

        },
        startPokerTable: async (_, { pokerTableId }, { userInfo, prisma, pubsub }) => {
            if (!userInfo) throw new GraphQLError('Please login to continue')

            try {
                const tableInit = await initPokerTable(prisma, pubsub, pokerTableId)
                if (tableInit.status === 'IN_PROGRESS') throw new GraphQLError('Game has already started.')
                if (tableInit.host_id !== userInfo.userId) throw new GraphQLError('Only the host can start this game.')
                await tableInit.table.dealCards()

                const clonePlayers = [...tableInit.table.players]

                const VettedTableData = {
                    status: tableInit.status,
                    buyIn: tableInit.table.buyIn,
                    communityCards: tableInit.table.communityCards,
                    handNumber: tableInit.table.handNumber,
                    players: clonePlayers.map(player => {
                        delete player.table
                        return player
                    }),
                    pots: tableInit.table.pots,
                    dealerPosition: tableInit.table.dealerPosition,
                    smallBlindPosition: tableInit.table.smallBlindPosition,
                    bigBlindPosition: tableInit.table.bigBlindPosition,
                    currentRound: tableInit.table.currentRound,
                    currentPosition: tableInit.table.currentPosition,
                    lastPosition: tableInit.table.lastPosition
                }

                pubsub.publish('POKER_TABLE_UPDATED', {
                    pokerTable: VettedTableData
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
    },
    Subscription: {
        pokerTableUpdated: (_, __, ___) => {
            console.log('Yup..')

            return {
                id: "123"
            }
        }
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
                    include: {
                        user: {
                            select: {
                                id: true,
                                last_seen: true,
                                username: true,
                                avatar: true,
                            }
                        }
                    }
                },
                poker_table_pots: {
                    include: {
                        eligible_players: true
                    }
                }
            }
        })

        const table = new Table()
        table.deck = pokerTable.deck
        table.handNumber = pokerTable.hand_number
        table.dealerPosition = 0
        table.smallBlindPosition = 1
        table.bigBlindPosition = 2
        table.players = pokerTable.participants.map((player) => {
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

            return newPlayer
        })
        table.pots = [{ amount: pokerTable.poker_table_pots[0].amount, eligiblePlayers: pokerTable.poker_table_pots[0].eligible_players }]

        return {
            status: pokerTable.status,
            table: table
        }

    } catch (e) {
        console.log('Error getting poker table data')
    }

}

export default resolvers
