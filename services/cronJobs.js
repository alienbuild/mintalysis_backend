import * as schedule from "node-schedule"
import {Immutascrape} from "./immutascrape.js"

 const scheduledRapidJobs = () => {
    schedule.scheduleJob('*/30 * * * * *', () => {
        Immutascrape()
    })
}

export { scheduledRapidJobs }