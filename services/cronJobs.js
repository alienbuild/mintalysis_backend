import * as schedule from "node-schedule"
import {Immutascrape} from "./immutascrape.js"

import { VEVE_GET_COLLECTIBLE_FLOORS } from "./alice/VEVE_GET_COLLECTIBLE_FLOORS.js";

const scheduledRapidJobs = () => {
    schedule.scheduleJob('*/30 * * * * *', () => {
        Immutascrape()
    })
}

const scheduledLiveJobs = () => {
    schedule.scheduleJob('*/15 * * * * *', () => {
        VEVE_GET_COLLECTIBLE_FLOORS()
    })
}

export { scheduledRapidJobs, scheduledLiveJobs }