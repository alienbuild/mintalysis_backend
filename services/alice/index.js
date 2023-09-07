import * as schedule from "node-schedule"
import { VEVE_GET_COLLECTIBLE_FLOORS } from "./VEVE/VEVE_GET_COLLECTIBLE_FLOORS.js"
import { VEVE_GET_COMIC_FLOORS } from "./VEVE/VEVE_GET_COMIC_FLOORS.js"
import { VEVE_GET_LATEST_COLLECTIBLES } from "./VEVE/VEVE_GET_LATEST_COLLECTIBLES.js"
import {VEVE_GET_LATEST_COMICS} from "./VEVE/VEVE_GET_LATEST_COMICS.js"
import {VEVE_GET_LATEST_BRANDS} from "./VEVE/VEVE_GET_LATEST_BRANDS.js"
import {VEVE_GET_LATEST_LICENSORS} from "./VEVE/VEVE_GET_LATEST_LICENSORS.js"
import {VEVE_GET_LATEST_SERIES} from "./VEVE/VEVE_GET_LATEST_SERIES.js"
import {
    GetWalletUsernamesFromVeveCollectibles,
    GetWalletUsernamesFromVeveComics
} from "../getWalletUsernamesFromVeve.js";

const scheduledHourlyJobs = () => {
    schedule.scheduleJob('05 * * * *', () => {
        VEVE_GET_COLLECTIBLE_FLOORS()
    })
    schedule.scheduleJob('08 * * * *', () => {
        VEVE_GET_COMIC_FLOORS()
    })
    schedule.scheduleJob('18 * * * *', () => {
        // GetWalletUsernamesFromVeveCollectibles()
        // GetWalletUsernamesFromVeveComics()
    })
}

const scheduledDailyJobs = () => {
    schedule.scheduleJob("0 0 * * *", () => {
        VEVE_GET_LATEST_LICENSORS()
        VEVE_GET_LATEST_BRANDS()
        VEVE_GET_LATEST_SERIES()
        VEVE_GET_LATEST_COLLECTIBLES()
        VEVE_GET_LATEST_COMICS()
    })
}

export { scheduledHourlyJobs, scheduledDailyJobs }