import mongoose from 'mongoose'

const VeveComicTxnSchema = new mongoose.Schema({
    comic_id: {
        type: String,
        index: true
    },
    date: Date,
    value: Number,
    token: {
        type: Number,
        index: true
    }
}, {
    timeseries: {
        timeField: 'date',
        metaField: 'comic_id',
        granularity: 'seconds'
    },
    expireAfterSeconds: "off"
})


const VeveComicTxn = mongoose.model('VeveComicTxn', VeveComicTxnSchema, 'veve-comic-transactions')
export default VeveComicTxn