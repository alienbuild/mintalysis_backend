import * as schedule from "node-schedule"
import {Immutascrape} from "./immutascrape.js";

 const scheduledRapidJobs = () => {
    schedule.scheduleJob('*/10 * * * * *', () => {
        console.log('[RUNNING] 15 second job')
        Immutascrape()
    })
}

export { scheduledRapidJobs }