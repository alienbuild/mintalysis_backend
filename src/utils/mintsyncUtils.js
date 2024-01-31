import fetch from 'node-fetch';
import pkg from 'agora-access-token';
import { google } from 'googleapis'
const { RtcTokenBuilder, RtcRole } = pkg;

const API_KEY = process.env.GOOGLE_PERSPECTIVE_KEY;
const DISCOVERY_URL = 'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1';

export const moderateMessage = async (message) => {
    const client = await google.discoverAPI(DISCOVERY_URL);
    const analyzeRequest = {
        comment: { text: message },
        languages: ['en'],
        requestedAttributes: { TOXICITY: {} },
        doNotStore: true
    };

    return new Promise((resolve, reject) => {
        client.comments.analyze({key: API_KEY, resource: analyzeRequest}, (err, response) => {
            if (err) {
                reject(err);
            } else {
                const { attributeScores } = response.data;
                return resolve(attributeScores.TOXICITY.summaryScore.value);
            }
        });
    });
};

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