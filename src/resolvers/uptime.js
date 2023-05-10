import fetch from 'node-fetch'
import {GraphQLError} from "graphql";
import pm2 from 'pm2'

const resolvers = {
    Query: {
        getMonitors: async (_, __, ___) => {

            try {
                const monitors = await fetch(`http://mintalysis.com:8000/monitors`, {
                    headers: {
                        Authorization: `Bearer ${process.env.KUMA_TOKEN}`
                    }
                })
                const result = await monitors.json()

                const uptimes = await fetch(`http://mintalysis.com:8000/uptime`, {
                    headers: {
                        Authorization: `Bearer ${process.env.KUMA_TOKEN}`                    }
                })
                const uptimeRes = await uptimes.json()

                await result.monitors.map(async monitor => {
                    const match = await uptimeRes.filter(obj => String(obj.id) === String(monitor.id))
                    if (match){
                        monitor.uptime = match[0]?.uptime
                    }
                })

                return result.monitors

            } catch (e) {
                throw new GraphQLError('Unable to get monitors.')
            }

        },
        getHeartbeats: async (_, { monitor_id }, ___) => {

            try {

                const heartbeats = await fetch(`http://mintalysis.com:8000/monitors/${monitor_id}/beats`, {
                    headers: {
                        Authorization: `Bearer ${process.env.KUMA_TOKEN}`                    }
                })
                const result = await heartbeats.json()

                return result.monitor_beats

            } catch (e) {
                throw new GraphQLError('Unable to get monitor heartbeats.')
            }

        },
        getProcesses: async (_, __ ,___) => {

            try {
                let results = []

                await pm2.connect(async (err) => {
                    if (err) throw new GraphQLError('Unable to connect to PM2')
                })

                const getPm2List = () => {
                    return new Promise((resolve, reject) => {
                        pm2.list((err, list) => {
                            if (err) throw new GraphQLError('Unable to connect to PM2')
                            resolve(list)
                        })
                    })
                }

                const processList = await getPm2List()

                processList.forEach((process) => {
                    results.push({
                        name: process.name,
                        pm_uptime: process.pm2_env.pm_uptime,
                        status: process.pm2_env.status,
                        memory: process.monit.memory,
                        cpu: process.monit.cpu
                    })
                })

                return results

            } catch (e) {
                throw new GraphQLError('[ERROR] Unable to get PM2 processes')
            }

        }
    },
}

export default resolvers