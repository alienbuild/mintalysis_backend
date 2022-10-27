import jwt from "jsonwebtoken"
import {JSON_SIGNATURE} from "../keys"

export const getUserFromToken = (token: string) => {
    try {
        return jwt.verify(token, JSON_SIGNATURE) as {
            userId: number
        }
    } catch (err) {
        return null
    }
}