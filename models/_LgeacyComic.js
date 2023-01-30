import mongoose from 'mongoose'

const ComicSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    comicSeries: {
        name: {
            type: String,
            required: true,
            index: true
        },
        description: {
            type: String
        }
    },
    publisher: {
        id: {
            type: String
        },
        name: {
            type: String
        },
        marketFee: {
            type: Number
        }
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    dropDate: {
        type: Date
    },
    description: {
        type: String,
    },
    cover: {
        id: {
            type: String
        },
        totalIssued: {
            type: Number
        },
        rarity: {
            type: String
        },
        image: {
            url: {
                type: String
            },
            thumbnailUrl: {
                type: String
            },
            lowResolutionUrl: {
                type: String
            },
            medResolutionUrl: {
                type: String
            },
            highResolutionUrl: {
                type: String
            },
            fullResolutionUrl: {
                type: String
            },
            direction: {
                type: String
            }
        }
    },
    storePrice: {
        type: Number
    },
    pageCount: {
        type: Number
    },
    comicNumber: {
        type: Number
    },
    totalIssued:{
        type: Number
    },
    totalAvailable: {
        type: Number
    },
    revenue:{
        realised: {
            type: Number
        },
        potential: {
            type: Number
        }
    },
    prevSold: {
        price: {
            type: Number
        },
        createdAt: {
            type: Date
        },
        issueNumber: {
            type: Number
        },
        listingType: {
            type: String
        }
    },
}, { timestamps: true })

const Comic = mongoose.model('Comic', ComicSchema, 'comics')
export default Comic