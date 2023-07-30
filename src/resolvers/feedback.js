const resolvers = {
    Mutation: {
        sendFeedback: async (_, { payload }, { userInfo, slack }) => {

            payload.date = new Date()

            try {
                await slack.client.chat.postMessage({
                    token: process.env.SLACK_BOT_TOKEN,
                    channel: "mintalysis_feedback",
                    text: payload.message,
                    blocks: [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": `New feedback:\n*<${payload.url}|${payload.url}>*`
                            }
                        },
                        {
                            "type": "section",
                            "fields": [
                                {
                                    "type": "mrkdwn",
                                    "text": `*Type:*\n${payload.type}`
                                },
                                {
                                    "type": "mrkdwn",
                                    "text": `*When:*\nSubmitted ${payload.date}`
                                },
                                userInfo && (
                                    {
                                        "type": "mrkdwn",
                                        "text": `*User:*\n${userInfo.email}`
                                    }
                                )
                            ]
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": `Message:\n*${payload.message}`
                            }
                        }
                    ]
                })

                return true

            } catch (e) {
                return false
            }

        }
    }
}

export default resolvers