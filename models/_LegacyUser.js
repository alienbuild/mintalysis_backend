import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        max: 32,
        unique: true,
        index: true,
        lowercase: true,
    },
    name: {
        type: String,
        trim: true,
        max: 32
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        lowercase: true,
    },
    hasImportedVault: {
        type: Boolean,
        default: false
    },
    profile: {
        type: String,
        required: false
    },
    twitter: { type: String },
    hashed_password: {
        type: String,
        required: true
    },
    salt: String,
    stripe_customer_id: String,
    subscriptions: [],
    role: {
        type: Number,
        default: 0
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    resetPasswordLink: {
        data: String,
        default: ''
    },
    wallet_address: {
        type: String
    },
    userCollection: {
        type: Array,
        default: []
    },
    userComics: {
        type: Array,
        default: []
    },
    watchList: {
        type: Array,
        default: []
    },
    valuation: {
        totalValuation: {
            type: Number,
            default: 0
        },
        comicsValuation: {
            type: Number,
            default: 0
        },
        collectiblesValuation: {
            type: Number,
            default: 0
        },
        omiValuation: {
            type: Number,
            default: 0
        }
    },
    history: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserValuationHistory'
    },
    notifications: {
        type: Array
    },
    is_mobile: Boolean,
}, { timestamps: true })

const User = mongoose.model('User', userSchema, 'users')
export default User