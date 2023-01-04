import HttpsProxyAgent from 'https-proxy-agent'
import fetch from 'node-fetch'

const getUsernameQuery = (username) => {
    return `query userList {
        userList(filterOptions: {username: "${username}"}, first: 5) {
            edges{
                node{
                    username
                }
            }
        }
    }`
}

export const validateVeveUsername = async (username) => {
    const callVeveApi = await fetch(`https://web.api.prod.veve.me/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-agent': 'alice-requests',
            'client-version': '...',
            'client-name': 'alice-backend',
            'cookie': process.env.ALICE_COOKIE,
        },
        body: JSON.stringify({query: getUsernameQuery(username)}),
    })
    const veveResponse = await callVeveApi.json()
    return veveResponse.data.userList

}