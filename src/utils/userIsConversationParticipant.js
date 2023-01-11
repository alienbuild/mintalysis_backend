export const userIsConversationParticipant = (participants, userId) => {
    return !!participants.find(participant => participant.user_id === userId)
}