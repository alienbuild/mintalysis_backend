import jwt from "jsonwebtoken"

export const getUserFromToken = (token) => {
    try {
        return jwt.verify(token, process.env.JSON_SIGNATURE);
    } catch (err) {
        return null
    }
}