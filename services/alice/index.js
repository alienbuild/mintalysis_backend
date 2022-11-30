import * as schedule from "node-schedule"
import { VEVE_GET_COLLECTIBLE_FLOORS } from "./VEVE_GET_COLLECTIBLE_FLOORS.js"
import { VEVE_GET_COMIC_FLOORS } from "./VEVE_GET_COMIC_FLOORS.js"

const scheduledHourlyJobs = () => {
    schedule.scheduleJob('05 * * * *', () => {
        VEVE_GET_COLLECTIBLE_FLOORS()
        VEVE_GET_COMIC_FLOORS()
    })
}

export { scheduledHourlyJobs }