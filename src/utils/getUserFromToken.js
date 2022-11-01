import jwt from "jsonwebtoken"

export const getUserFromToken = (token) => {
    try {
        // jwt.verify(token, JSON_SIGNATURE, (err, decodedData) => {
        //     console.log('decoded data is: ', decodedData)
        //     return decodedData
        // })
        return jwt.verify(token, process.env.JSON_SIGNATURE);
    } catch (err) {
        return null
    }
}