import HttpsProxyAgent from 'https-proxy-agent'
import fetch from 'node-fetch'

// Setup proxy
const proxy_string = process.env.PROXY
const proxy_parts = proxy_string.split(':')
const ip_address = proxy_parts[0]
const port = proxy_parts[1]
const username = proxy_parts[2]
const password = proxy_parts[3]

const proxyAgent = new HttpsProxyAgent(`http://${username}:${password}@${ip_address}:${port}`)

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

export const checkVeveUsername = async (username) => {
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