import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

export const VEVE_WALLET_VALUATION = async () => {

    // First get active wallets within the last 6 months

    const wallets = await prisma.veve_wallets.findMany({
        where: {
            take: 100,
            last_activity_date: {
                gte: sixMonthsAgo.toISOString(),
            },
            active: false // active === processed
        },
    })

    wallets.map(async wallet => {
        await prisma.veve_tokens.findMany({})
    })

    console.log('wallet count is: ', wallets)
    // Figure out what tokens that wallet held 28 days ago
    // Calculate the floor prices of all tokens held on that day and save valuation
    // Continue to find the total floor prices for all tokens every day between then and now

}

VEVE_WALLET_VALUATION()