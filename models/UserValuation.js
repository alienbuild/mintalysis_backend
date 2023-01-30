import mongoose from "mongoose"
import CollectiblePrice from "./CollectiblePrices.js"

const UserValuationSchema = new mongoose.Schema({
    user_id: {
        type: String,
        index: true
    },
    valuation: {
        type: Number
    },
    valuation_collectibles: {
        type: Number
    },
    valuation_comics: {
        type: Number
    },
    date: {
        type: Date
    }
}, {
    timeseries: {
        timeField: 'date',
        metaField: 'user_id',
        granularity: 'hours'
    },
    expireAfterSeconds: "off"
})

const UserValuation = mongoose.model('UserValuation', UserValuationSchema, 'user-valuations')
export default UserValuation
