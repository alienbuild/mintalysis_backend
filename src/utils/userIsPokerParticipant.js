export const userIsPokerParticipant = (participants, userId) => {
    return !!participants.find(participant => participant.user_id === userId)
}