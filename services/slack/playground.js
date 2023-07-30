import Slack from '@slack/bolt'

const blocks = [
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "New feedback:\n*<mintalysis.com|mintalysis.com/news/veve/123>*"
        }
    },
    {
        "type": "section",
        "fields": [
            {
                "type": "mrkdwn",
                "text": "*Type:*\nTranslation issue (CN)"
            },
            {
                "type": "mrkdwn",
                "text": "*When:*\nSubmitted Jul 30"
            }
        ]
    },
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "Message:\n*This article sucks, please fix it. lolz."
        }
    }
]

const app = new Slack.App({
    signingSecret: "9045e0a6c86affe1b602ed7297b603f7",
    token: "xoxb-3129207190435-5673285806417-peO256pawGSEVF8CynhUqaZR"
})

await app.client.chat.postMessage({
    token: "xoxb-3129207190435-5673285806417-peO256pawGSEVF8CynhUqaZR",
    channel: "mintalysis_feedback",
    text: `This is test feedback.`,
    blocks
})

console.log('App is: ', app)