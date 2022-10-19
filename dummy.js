const collectibles = [
    {
        id: "1",
        name: "Delorean",
        description: "Time travelling car",
        price: 77.77,
        brandId: "3",
        soldOut: true
    },
    {
        id: "2",
        name: "All Together Now!",
        description: "Mickey Mouse",
        price: 29.99,
        brandId: "1",
        soldOut: false
    },
    {
        id: "3",
        name: "Ghostbusters Logo",
        description: "Weird logo",
        price: 12.77,
        brandId: "1",
        soldOut: true
    }
]

const brands = [
    {
        id: "1",
        name: "Ghostbusters",
    },
    {
        id: "2",
        name: "Disney",
    },
    {
        id: "3",
        name: "Back to the future",
    }
]

module.exports = {
    collectibles,
    brands
}