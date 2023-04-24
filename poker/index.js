import { Table, Player } from "@chevtek/poker-engine"

// const table = new Table();
// console.log('table is: ', table)

// {
//     buyIn: 1000,
//     smallBlind: 5,
//     bigBlind: 10,
//     autoMoveDealer: true,
//     communityCards: [],
//     debug: false,
//     deck: [],
//     handNumber: 0,
//     players: [
//     null, null, null,
//     null, null, null,
//     null, null, null,
//     null
// ],
//     pots: []
// }

const table = new Table()
table.communityCards = []
table.deck = []
table.handNumber = 0
table.players = [
    null, null, null,
    null, null, null,
    null, null, null,
    null
]
table.pots = []

table.sitDown("Player 1", 1000);

table.sitDown("Player 2", 1000);
table.sitDown("Player 3", 1000);

console.log('table is: ', table)

table.dealCards();

// console.log('community cards are: ', table.communityCards)

// player 1 (dealer) is first to act.
table.currentActor.callAction();

// player 2 is first to act on the flop.
table.currentActor.callAction();

// console.log(table.currentActor.legalActions());

// player 3 decides to open the bet on the flop.
table.currentActor.checkAction();

// console.log('community cards are: ', table.communityCards)

// player 1 raises.
table.currentActor.betAction(40);

// player 2 calls.
table.currentActor.callAction();

// player 3 calls player 1's raise.
table.currentActor.callAction();
// console.log('community cards are: ', table.communityCards)
// console.log('community cards are: ', table.communityCards[0])

table.communityCards.map(card => {
    // console.log(`Card color is: ${card.color}. Rank is ${card.rank}. Suit is ${card.suit}. SuitChar is: ${card.suitChar}`)
})

// betting has been met, player 2 is first to act on the turn and all three decide to check.
table.currentActor.checkAction();
table.currentActor.checkAction();
table.currentActor.checkAction();

// player 2 is first to act on the river and decides
// to open the bet at $40.
table.currentActor.betAction(40);

// player 3 raises to $60.
table.currentActor.raiseAction(60);
// player 1 folds.
table.currentActor.foldAction();
table.currentActor.foldAction();

// console.log('community cards are: ', table.communityCards)


// Declare winner(s)!

console.log('WINNER!!!!');
// console.log('WINNER!!!!', table.winners);