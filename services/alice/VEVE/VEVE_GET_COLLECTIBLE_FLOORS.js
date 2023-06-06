import fetch from 'node-fetch'
import CollectiblePrice from "../../../models/CollectiblePrices.js"
import MarketPrice from "../../../models/MarketPrice.js"
import slugify from 'slugify'
import HttpsProxyAgent from "https-proxy-agent"
import {cookieRotator} from "../cookieRotator.js"

import { prisma } from "../../../src/index.js"
import { pubsub } from "../../../src/index.js"

// Setup proxy
const proxy_string = process.env.PROXY
const proxy_parts = proxy_string.split(':')
const ip_address = proxy_parts[0]
const port = proxy_parts[1]
const username = proxy_parts[2]
const password = proxy_parts[3]

const proxyAgent = new HttpsProxyAgent(`http://${username}:${password}@${ip_address}:${port}`)

const getVeveCollectibleFloorsQuery = () => {
    return `query collectibleTypeList {
    collectibleTypeList(first: 2000) {
        pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
        }
        edges{
            node{
                id
                name
                totalMarketListings
                floorMarketPrice
                storePrice
            }
        }
    }
}`
}

const updateTimeSeries = (collectible) => {
    return new Promise((resolve, reject) => {
        CollectiblePrice.find({ collectibleId: collectible.id })
            .lean()
            .sort({ date: -1 })
            .limit(5)
            .exec((err, history) => {
                if (err) console.log('Unable to get timeseries data: ', err)
                let newArr = []
                const getDifference = (a, b) => {
                    return Math.abs(a - b);
                }
                const calculateVolume = (totalSales = 0) => {
                    if (isNaN(totalSales)) {
                        totalSales = 0
                    }
                    return totalSales * parseFloat(collectible.floorMarketPrice)
                }
                const calculateCandleHigh = () => {
                    const shallowCopy = history.slice(0, 4)

                    return Math.max.apply(Math, shallowCopy.map(function (o) {
                        return o.value;
                    }))
                }
                const calculateCandleLow = () => {
                    const shallowCopy = history.slice(0, 4)

                    return Math.min.apply(Math, shallowCopy.map(function (o) {
                        return o.value;
                    }))
                }
                const calculateCandleOpen = () => {
                    return history[history.length - 1].value
                }

                const newPriceHistory = new CollectiblePrice({
                    collectibleId: collectible.id,
                    date: new Date(),
                    value: collectible.floorMarketPrice,
                    listings: Number(collectible.totalMarketListings),
                    // lastSold: typeof prevSoldData.data.marketingList.edges[0] !== "undefined" && prevSoldData.data.marketingList.edges[0] !== null ? parseFloat(prevSoldData.data.marketingList.edges[0].node.currentPrice) : 0,
                    volume: calculateVolume(getDifference(history[history.length - 1]?.listings, Number(collectible.totalMarketListings))),
                    high: history.length < 1 ? collectible.floorMarketPrice : calculateCandleHigh(0),
                    low: history.length < 1 ? collectible.floorMarketPrice : calculateCandleLow(0),
                    open: history.length < 1 ? collectible.storePrice : calculateCandleOpen()
                })
                newArr.push(newPriceHistory)

                CollectiblePrice.insertMany(newArr)
                    .then((success) => {
                        resolve()
                    })
                    .catch((error) => console.log(`[ERROR] Unable to insertMany on CollectiblePrice. name is ${collectible.name} / ${collectible.id}`))
            })
    })
}

const updateMintalysis = async (collectible) => {

    let collectibleMetrics = await CollectiblePrice.aggregate([
        {
            '$match': {
                'collectibleId': collectible.id
            }
        }, {
            '$set': {
                'target-date': '$$NOW'
            }
        }, {
            '$facet': {
                'one_day': [
                    {
                        '$match': {
                            '$expr': {
                                '$lte': [
                                    {
                                        '$subtract': [
                                            '$target-date', '$date'
                                        ]
                                    }, {
                                        '$multiply': [
                                            24, 60, 60, 1000
                                        ]
                                    }
                                ]
                            }
                        }
                    }, {
                        '$group': {
                            '_id': null,
                            'avg': {
                                '$avg': '$value'
                            },
                            'previous': {
                                '$first': '$value'
                            },
                            'current': {
                                '$last': '$value'
                            },
                            'min': {
                                '$min': '$low'
                            },
                            'max': {
                                '$max': '$high'
                            }
                        }
                    },
                    {
                        '$addFields': {
                            'percentage_change': {
                                '$multiply': [
                                    {
                                        '$divide': [
                                            {
                                                '$subtract': [
                                                    '$current', '$previous'
                                                ]
                                            }, '$current'
                                        ]
                                    }, 100
                                ]
                            }
                        }
                    }, {
                        '$unset': [
                            '_id'
                        ]
                    }
                ],
                'one_week': [
                    {
                        '$match': {
                            '$expr': {
                                '$lte': [
                                    {
                                        '$subtract': [
                                            '$target-date', '$date'
                                        ]
                                    }, {
                                        '$multiply': [
                                            7, 24, 60, 60, 1000
                                        ]
                                    }
                                ]
                            }
                        }
                    }, {
                        '$group': {
                            '_id': null,
                            'avg': {
                                '$avg': '$value'
                            },
                            'previous': {
                                '$first': '$value'
                            },
                            'current': {
                                '$last': '$value'
                            },
                            'min': {
                                '$min': '$low'
                            },
                            'max': {
                                '$max': '$high'
                            }
                        }
                    },
                    {
                        '$addFields': {
                            'percentage_change': {
                                '$multiply': [
                                    {
                                        '$divide': [
                                            {
                                                '$subtract': [
                                                    '$current', '$previous'
                                                ]
                                            }, '$current'
                                        ]
                                    }, 100
                                ]
                            }
                        }
                    }, {
                        '$unset': [
                            '_id'
                        ]
                    }
                ],
                'one_month': [
                    {
                        '$match': {
                            '$expr': {
                                '$lte': [
                                    {
                                        '$subtract': [
                                            '$target-date', '$date'
                                        ]
                                    }, {
                                        '$multiply': [
                                            30, 24, 60, 60, 1000
                                        ]
                                    }
                                ]
                            }
                        }
                    }, {
                        '$group': {
                            '_id': null,
                            'avg': {
                                '$avg': '$value'
                            },
                            'previous': {
                                '$first': '$value'
                            },
                            'current': {
                                '$last': '$value'
                            },
                            'min': {
                                '$min': '$low'
                            },
                            'max': {
                                '$max': '$high'
                            }
                        }
                    },{
                        '$addFields': {
                            'percentage_change': {
                                '$multiply': [
                                    {
                                        '$divide': [
                                            {
                                                '$subtract': [
                                                    '$current', '$previous'
                                                ]
                                            }, '$current'
                                        ]
                                    }, 100
                                ]
                            }
                        }
                    }, {
                        '$unset': [
                            '_id'
                        ]
                    }
                ],
                'three_months': [
                    {
                        '$match': {
                            '$expr': {
                                '$lte': [
                                    {
                                        '$subtract': [
                                            '$target-date', '$date'
                                        ]
                                    }, {
                                        '$multiply': [
                                            3, 30, 24, 60, 60, 1000
                                        ]
                                    }
                                ]
                            }
                        }
                    }, {
                        '$group': {
                            '_id': null,
                            'avg': {
                                '$avg': '$value'
                            },
                            'previous': {
                                '$first': '$value'
                            },
                            'current': {
                                '$last': '$value'
                            },
                            'min': {
                                '$min': '$low'
                            },
                            'max': {
                                '$max': '$high'
                            }
                        }
                    },{
                        '$addFields': {
                            'percentage_change': {
                                '$multiply': [
                                    {
                                        '$divide': [
                                            {
                                                '$subtract': [
                                                    '$current', '$previous'
                                                ]
                                            }, '$current'
                                        ]
                                    }, 100
                                ]
                            }
                        }
                    }, {
                        '$unset': [
                            '_id'
                        ]
                    }
                ],
                'six_months': [
                    {
                        '$match': {
                            '$expr': {
                                '$lte': [
                                    {
                                        '$subtract': [
                                            '$target-date', '$date'
                                        ]
                                    }, {
                                        '$multiply': [
                                            6, 30, 24, 60, 60, 1000
                                        ]
                                    }
                                ]
                            }
                        }
                    }, {
                        '$group': {
                            '_id': null,
                            'avg': {
                                '$avg': '$value'
                            },
                            'previous': {
                                '$first': '$value'
                            },
                            'current': {
                                '$last': '$value'
                            },
                            'min': {
                                '$min': '$low'
                            },
                            'max': {
                                '$max': '$high'
                            }
                        }
                    },{
                        '$addFields': {
                            'percentage_change': {
                                '$multiply': [
                                    {
                                        '$divide': [
                                            {
                                                '$subtract': [
                                                    '$current', '$previous'
                                                ]
                                            }, '$current'
                                        ]
                                    }, 100
                                ]
                            }
                        }
                    }, {
                        '$unset': [
                            '_id'
                        ]
                    }
                ],
                'one_year': [
                    {
                        '$match': {
                            '$expr': {
                                '$lte': [
                                    {
                                        '$subtract': [
                                            '$target-date', '$date'
                                        ]
                                    }, {
                                        '$multiply': [
                                            12, 30, 24, 60, 60, 1000
                                        ]
                                    }
                                ]
                            }
                        }
                    }, {
                        '$group': {
                            '_id': null,
                            'avg': {
                                '$avg': '$value'
                            },
                            'previous': {
                                '$first': '$value'
                            },
                            'current': {
                                '$last': '$value'
                            },
                            'min': {
                                '$min': '$low'
                            },
                            'max': {
                                '$max': '$high'
                            }
                        }
                    },{
                        '$addFields': {
                            'percentage_change': {
                                '$multiply': [
                                    {
                                        '$divide': [
                                            {
                                                '$subtract': [
                                                    '$current', '$previous'
                                                ]
                                            }, '$current'
                                        ]
                                    }, 100
                                ]
                            }
                        }
                    }, {
                        '$unset': [
                            '_id'
                        ]
                    }
                ],
                'all_time': [
                    {
                        '$group': {
                            '_id': null,
                            'avg': {
                                '$avg': '$value'
                            },
                            'previous': {
                                '$first': '$value'
                            },
                            'current': {
                                '$last': '$value'
                            },
                            'min': {
                                '$min': '$low'
                            },
                            'max': {
                                '$max': '$high'
                            }
                        }
                    }, {
                        '$addFields': {
                            'percentage_change': {
                                '$multiply': [
                                    {
                                        '$divide': [
                                            {
                                                '$subtract': [
                                                    '$current', '$previous'
                                                ]
                                            }, '$current'
                                        ]
                                    }, 100
                                ]
                            }
                        }
                    }, {
                        '$unset': [
                            '_id'
                        ]
                    }
                ]
            }
        }
    ])
    collectibleMetrics = collectibleMetrics[0]

    let total_issued = await prisma.veve_collectibles.findUnique({where: {collectible_id: collectible.id}})
    total_issued = total_issued?.total_issued ? total_issued.total_issued : 0

    const market_cap = Number(collectible.floorMarketPrice) * Number(total_issued)
    const one_day_change = collectibleMetrics.one_day[0]?.percentage_change
    const one_wk_change = collectibleMetrics.one_week[0]?.percentage_change
    const one_mo_change = collectibleMetrics?.one_month[0]?.percentage_change
    const three_mo_change = collectibleMetrics?.three_months[0]?.percentage_change
    const six_mo_change = collectibleMetrics?.six_months[0]?.percentage_change
    const one_year_change = collectibleMetrics?.one_year[0]?.percentage_change
    const all_time_change = collectibleMetrics?.all_time[0]?.percentage_change

    let all_time_high = await CollectiblePrice.find({collectibleId: collectible.id }).sort({value: -1}).select('value').limit(1)
    all_time_high = all_time_high[0]?.value

    let all_time_low = await CollectiblePrice.find({collectibleId: collectible.id }).sort({value: 1}).select('value').limit(1)
    all_time_low = all_time_low[0]?.value

    return new Promise(async (resolve, reject) => {
        try {
            await prisma.veve_collectibles.update({
                data: {
                    floor_price: Number(collectible.floorMarketPrice),
                    total_listings: Number(collectible.totalMarketListings),
                    one_day_change,
                    one_wk_change,
                    one_mo_change,
                    one_year_change,
                    six_mo_change,
                    three_mo_change,
                    all_time_change,
                    market_cap,
                },
                where: {
                    collectible_id: collectible.id
                }
            })
        } catch (e) {
            console.log(`[ERROR] Unable to update mintalysis - Name: ${collectible.name}. Id: ${collectible.id}`)
        }
        resolve()
    })
}

const getCollectibleStats = (collectibleId) => {
    return new Promise((resolve, reject) => {
        CollectiblePrice.aggregate([
            {
                '$match': {
                    'collectibleId': collectibleId
                }
            }, {
                '$set': {
                    'target-date': '$$NOW'
                }
            }, {
                '$facet': {
                    'one_day': [
                        {
                            '$match': {
                                '$expr': {
                                    '$lte': [
                                        {
                                            '$subtract': [
                                                '$target-date', '$date'
                                            ]
                                        }, {
                                            '$multiply': [
                                                24, 60, 60, 1000
                                            ]
                                        }
                                    ]
                                }
                            }
                        }, {
                            '$group': {
                                '_id': null,
                                'avg': {
                                    '$avg': '$value'
                                },
                                'previous': {
                                    '$first': '$value'
                                },
                                'current': {
                                    '$last': '$value'
                                },
                                'min': {
                                    '$min': '$low'
                                },
                                'max': {
                                    '$max': '$high'
                                }
                            }
                        },
                        {
                            '$addFields': {
                                'percentage_change': {
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                {
                                                    '$subtract': [
                                                        '$current', '$previous'
                                                    ]
                                                }, '$current'
                                            ]
                                        }, 100
                                    ]
                                }
                            }
                        }, {
                            '$unset': [
                                '_id'
                            ]
                        }
                    ],
                    'one_week': [
                        {
                            '$match': {
                                '$expr': {
                                    '$lte': [
                                        {
                                            '$subtract': [
                                                '$target-date', '$date'
                                            ]
                                        }, {
                                            '$multiply': [
                                                7, 24, 60, 60, 1000
                                            ]
                                        }
                                    ]
                                }
                            }
                        }, {
                            '$group': {
                                '_id': null,
                                'avg': {
                                    '$avg': '$value'
                                },
                                'previous': {
                                    '$first': '$value'
                                },
                                'current': {
                                    '$last': '$value'
                                },
                                'min': {
                                    '$min': '$low'
                                },
                                'max': {
                                    '$max': '$high'
                                }
                            }
                        },
                        {
                            '$addFields': {
                                'percentage_change': {
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                {
                                                    '$subtract': [
                                                        '$current', '$previous'
                                                    ]
                                                }, '$current'
                                            ]
                                        }, 100
                                    ]
                                }
                            }
                        }, {
                            '$unset': [
                                '_id'
                            ]
                        }
                    ],
                    'one_month': [
                        {
                            '$match': {
                                '$expr': {
                                    '$lte': [
                                        {
                                            '$subtract': [
                                                '$target-date', '$date'
                                            ]
                                        }, {
                                            '$multiply': [
                                                30, 24, 60, 60, 1000
                                            ]
                                        }
                                    ]
                                }
                            }
                        }, {
                            '$group': {
                                '_id': null,
                                'avg': {
                                    '$avg': '$value'
                                },
                                'previous': {
                                    '$first': '$value'
                                },
                                'current': {
                                    '$last': '$value'
                                },
                                'min': {
                                    '$min': '$low'
                                },
                                'max': {
                                    '$max': '$high'
                                }
                            }
                        },{
                            '$addFields': {
                                'percentage_change': {
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                {
                                                    '$subtract': [
                                                        '$current', '$previous'
                                                    ]
                                                }, '$current'
                                            ]
                                        }, 100
                                    ]
                                }
                            }
                        }, {
                            '$unset': [
                                '_id'
                            ]
                        }
                    ],
                    'three_months': [
                        {
                            '$match': {
                                '$expr': {
                                    '$lte': [
                                        {
                                            '$subtract': [
                                                '$target-date', '$date'
                                            ]
                                        }, {
                                            '$multiply': [
                                                3, 30, 24, 60, 60, 1000
                                            ]
                                        }
                                    ]
                                }
                            }
                        }, {
                            '$group': {
                                '_id': null,
                                'avg': {
                                    '$avg': '$value'
                                },
                                'previous': {
                                    '$first': '$value'
                                },
                                'current': {
                                    '$last': '$value'
                                },
                                'min': {
                                    '$min': '$low'
                                },
                                'max': {
                                    '$max': '$high'
                                }
                            }
                        },{
                            '$addFields': {
                                'percentage_change': {
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                {
                                                    '$subtract': [
                                                        '$current', '$previous'
                                                    ]
                                                }, '$current'
                                            ]
                                        }, 100
                                    ]
                                }
                            }
                        }, {
                            '$unset': [
                                '_id'
                            ]
                        }
                    ],
                    'six_months': [
                        {
                            '$match': {
                                '$expr': {
                                    '$lte': [
                                        {
                                            '$subtract': [
                                                '$target-date', '$date'
                                            ]
                                        }, {
                                            '$multiply': [
                                                6, 30, 24, 60, 60, 1000
                                            ]
                                        }
                                    ]
                                }
                            }
                        }, {
                            '$group': {
                                '_id': null,
                                'avg': {
                                    '$avg': '$value'
                                },
                                'previous': {
                                    '$first': '$value'
                                },
                                'current': {
                                    '$last': '$value'
                                },
                                'min': {
                                    '$min': '$low'
                                },
                                'max': {
                                    '$max': '$high'
                                }
                            }
                        },{
                            '$addFields': {
                                'percentage_change': {
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                {
                                                    '$subtract': [
                                                        '$current', '$previous'
                                                    ]
                                                }, '$current'
                                            ]
                                        }, 100
                                    ]
                                }
                            }
                        }, {
                            '$unset': [
                                '_id'
                            ]
                        }
                    ],
                    'one_year': [
                        {
                            '$match': {
                                '$expr': {
                                    '$lte': [
                                        {
                                            '$subtract': [
                                                '$target-date', '$date'
                                            ]
                                        }, {
                                            '$multiply': [
                                                12, 30, 24, 60, 60, 1000
                                            ]
                                        }
                                    ]
                                }
                            }
                        }, {
                            '$group': {
                                '_id': null,
                                'avg': {
                                    '$avg': '$value'
                                },
                                'previous': {
                                    '$first': '$value'
                                },
                                'current': {
                                    '$last': '$value'
                                },
                                'min': {
                                    '$min': '$low'
                                },
                                'max': {
                                    '$max': '$high'
                                }
                            }
                        },{
                            '$addFields': {
                                'percentage_change': {
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                {
                                                    '$subtract': [
                                                        '$current', '$previous'
                                                    ]
                                                }, '$current'
                                            ]
                                        }, 100
                                    ]
                                }
                            }
                        }, {
                            '$unset': [
                                '_id'
                            ]
                        }
                    ],
                    'all_time': [
                        {
                            '$group': {
                                '_id': null,
                                'avg': {
                                    '$avg': '$value'
                                },
                                'previous': {
                                    '$first': '$value'
                                },
                                'current': {
                                    '$last': '$value'
                                },
                                'min': {
                                    '$min': '$low'
                                },
                                'max': {
                                    '$max': '$high'
                                }
                            }
                        }, {
                            '$addFields': {
                                'percentage_change': {
                                    '$multiply': [
                                        {
                                            '$divide': [
                                                {
                                                    '$subtract': [
                                                        '$current', '$previous'
                                                    ]
                                                }, '$current'
                                            ]
                                        }, 100
                                    ]
                                }
                            }
                        }, {
                            '$unset': [
                                '_id'
                            ]
                        }
                    ]
                }
            }
        ]).exec((err, success) => {
            if (err) console.log('Error with aggregation: ', err)
            if (success) resolve(success)
        })
    })
}

const updateLegacyShit = async (collectible) => {
    // TODO: DELETE THIS FUNCTION WHEN ECOMIWIKI IS DEAD

    const collectibleMeta = await prisma.veve_collectibles.findUnique({where: {collectible_id: collectible.id}})
    const calcMetrics = await getCollectibleStats(collectible.id)
    if (!collectibleMeta || !collectibleMeta.total_issued) return

    const collectibleMarketData = {
        "collectibleId": collectible.id,
        "name": collectible.name,
        "slug": slugify(collectible.name),
        "totalIssued": collectibleMeta.total_issued,
        "rarity": collectibleMeta.rarity,
        "brand": {
            "name": 'Unknown',
            "id": 'Unknown',
            "squareImage": {
                "thumbnailUrl": collectibleMeta.image_thumbnail_url ? collectibleMeta.image_thumbnail_url : 'https://via.placeholder.com/150',
            }
        },
        "image": {
            "direction": collectibleMeta.image_direction,
            "thumbnailUrl": collectibleMeta.image_thumbnail_url ? collectibleMeta.image_thumbnail_url : 'https://via.placeholder.com/150',
            "url": collectibleMeta.image_high_resolution_url,
            "lowResolutionUrl": collectibleMeta.image_low_resolution_url,
            "medResolutionUrl": collectibleMeta.image_med_resolution_url,
        },
        "storePrice": collectibleMeta.store_price,
        "edition_type": collectibleMeta.edition_type,
        "createdAt": collectibleMeta.drop_date,
        "metrics": {
            "marketCapFullyDiluted": Number(collectible.floorMarketPrice) * Number(collectibleMeta.total_issued),
            "lowestPrice": collectible.floorMarketPrice,
            "totalListings": collectible.totalMarketListings,
            "updatedAt": new Date(),
            "prevSoldArr" : [
                {
                    "node" : {
                        "status" : "CLOSED",
                        "currentPrice" : "0",
                        "createdAt" : "2022-11-30T06:05:57.550Z",
                        "listingType" : "FIXED",
                        "element" : {
                            "issueNumber" : 0,
                            "collectibleType" : {
                                "id" : "3c76162d-7198-411c-ac08-64853daa07eb",
                                "name" : collectible.name,
                                "rarity" : "ULTRA_RARE",
                                "editionType" : "FE",
                                "totalIssued" : 0
                            }
                        }
                    }
                },
            ],
            "ath": calcMetrics[0].all_time[0]?.max !== "undefined" && calcMetrics[0].all_time[0]?.max !== null ? calcMetrics[0].all_time[0]?.max : null,
            "atl": calcMetrics[0].all_time[0]?.min !== "undefined" && calcMetrics[0].all_time[0]?.min !== null ? calcMetrics[0].all_time[0]?.min : null,
            "at_avg": calcMetrics[0].all_time[0]?.avg !== "undefined" && calcMetrics[0].all_time[0]?.avg !== null ? calcMetrics[0].all_time[0]?.avg : null,
        },
        change: calcMetrics
    }

    MarketPrice.findOneAndUpdate({collectibleId: collectible._id}, collectibleMarketData,{
        upsert: true,
        new: true
    })
        .exec((err, success) => {
            if (err) console.log('Error saving/updating market price. ', err)
            if (success) console.log(`[LEGACY] Updated ${collectible.name}`)
        })

}

export const VEVE_GET_COLLECTIBLE_FLOORS = async () => {

    const cookieToUse = cookieRotator()

    console.log(`[ALICE][VEVE] - [COLLECTIBLE FLOORS]`)
    await fetch(`https://web.api.prod.veve.me/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'cookie': cookieToUse,
            'client-name': 'veve-web-app',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'client-operation': 'AuthUserDetails',
            // 'client-name': 'alice-backend',
            // 'client-version': '...',
            // 'user-agent': 'alice-requests',
            // 'cookie': "veve=s%3ABBzqVcXCx-u7b2OnNrI2hQEwq14FXASo.C%2F5sObS5AunP8qIBZeqDEC3WnCnVsEdY9qMNQ%2FPGQK4"
        },
        // agent: proxyAgent,
        body: JSON.stringify({
            query: getVeveCollectibleFloorsQuery(),
        }),
    })
        .then(collectible_floors => collectible_floors.json())
        .then(async collectible_floors => {
            const edges = collectible_floors.data.collectibleTypeList.edges
            await edges.map(async (collectible, index) => {
                // if (index > 0) return
                await updateTimeSeries(collectible.node)
                await updateMintalysis(collectible.node)
                await updateLegacyShit(collectible.node)
            })

            await pubsub.publish(`VEVE_PRICES_UPDATED`, {
                veveCollectiblePrice: new Date()
            })

        })
        .catch(err => console.log(`[ERROR][VEVE] Unable to get collectible floors using ${cookieToUse} `, err))
}
