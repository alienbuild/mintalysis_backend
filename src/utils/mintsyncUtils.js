import fetch from 'node-fetch';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;

export const moderateMessage = async (message) => {
    const url = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
    const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            comment: {text: message},
            languages: ['en'],
            requestedAttributes: {TOXICITY: {}},
            key: process.env.GOOGLE_CLIENT_SECRET,
        }),
    });
    const {attributeScores} = await response.json();
    return attributeScores.TOXICITY.summaryScore.value;
}

export const createUniqueChannelName = (serverId, channelId) => {
    return `mintalysis_channel_${serverId}_${channelId}`
}

const appId = process.env.AGORA_APP_ID;
const appCertificate = process.env.AGORA_APP_CERTIFICATE;
const expirationTimeInSeconds = 3600;

export const createRtcToken = (channelName, uid) => {
    const role = RtcRole.PUBLISHER;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithAccount(appId, appCertificate, channelName, uid, role, privilegeExpiredTs);
}