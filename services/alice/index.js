import * as schedule from "node-schedule"
import { VEVE_GET_COLLECTIBLE_FLOORS } from "./VEVE_GET_COLLECTIBLE_FLOORS.js"
import { VEVE_GET_COMIC_FLOORS } from "./VEVE_GET_COMIC_FLOORS.js"
import { VEVE_GET_LATEST_COLLECTIBLES } from "./VEVE_GET_LATEST_COLLECTIBLES.js"
import {VEVE_GET_LATEST_COMICS} from "./VEVE_GET_LATEST_COMICS.js"
import {VEVE_GET_LATEST_BRANDS} from "./VEVE_GET_LATEST_BRANDS.js"
import {VEVE_GET_LATEST_LICENSORS} from "./VEVE_GET_LATEST_LICENSORS.js"
import {VEVE_GET_LATEST_SERIES} from "./VEVE_GET_LATEST_SERIES.js"

const scheduledHourlyJobs = () => {
    console.log('Hourly jobs queued up.')
    schedule.scheduleJob('05 * * * *', () => {
        VEVE_GET_COLLECTIBLE_FLOORS()
        VEVE_GET_COMIC_FLOORS()
    })
}

const scheduledDailyJobs = () => {
    console.log('Daily jobs queued up.')
    schedule.scheduleJob("0 0 * * *", () => {
        VEVE_GET_LATEST_COLLECTIBLES()
        VEVE_GET_LATEST_COMICS()
        VEVE_GET_LATEST_BRANDS()
        VEVE_GET_LATEST_LICENSORS()
        VEVE_GET_LATEST_SERIES
    })
}

export { scheduledHourlyJobs, scheduledDailyJobs }