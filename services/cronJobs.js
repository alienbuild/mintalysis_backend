import * as schedule from "node-schedule"
import {VEVE_IMX_TRANSACTIONS} from "./live/VEVE_IMX_TRANSACTIONS.js"

import { VEVE_GET_COLLECTIBLE_FLOORS } from "./alice/VEVE_GET_COLLECTIBLE_FLOORS.js";
import {VEVE_IMX_MINTS} from "./live/VEVE_IMX_MINTS.js";
import moment from "moment";

const scheduledRapidJobs = () => {
    schedule.scheduleJob('*/30 * * * * *', () => {
        VEVE_IMX_TRANSACTIONS()
        VEVE_IMX_MINTS()
    })
}

const scheduledLiveJobs = () => {
    schedule.scheduleJob('*/30 * * * * *', () => {
        VEVE_GET_COLLECTIBLE_FLOORS()
    })
}

export { scheduledRapidJobs, scheduledLiveJobs }