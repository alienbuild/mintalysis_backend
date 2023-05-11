import gql from 'graphql-tag'

const typeDefs = gql`
    
    type Query {
        getMonitors: [Monitor]
        getHeartbeats(monitor_id: ID!): [Heartbeat]
        getProcesses: [PMProcess]
    }
    
    type Monitor {
        id: ID!
        name: String
        description: String
        active: Boolean
        type: String
        interval: Int
        maintenance: Boolean 
        uptime: Float
    }
    
    type Heartbeat {
        id: ID
        monitor_id: Int
        status: Boolean
        msg: String
        time: DateTime
        ping: Float
        duration: Int
        down_count: Int
    }
    
    type PMProcess {
        name: String
        status: String
        pm_uptime: Float
        memory: Float
        cpu: Float
    }
`

export default typeDefs

