import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()


const getVeveTotals = async () => {

    try {
        // Retrieve data for each veve_collectible
        const collectiblesData = await prisma.veve_collectibles.findMany({
            where: {
                metrics: {
                    NOT: {
                        floor_price: null,
                    },
                },
            },
            include: {
                metrics: true
            },
        });

        // Initialize variables to store the total market cap for different time periods
        let totalMarketCap = 0;
        let totalMarketCapOneDayAgo = 0;
        let totalMarketCapOneWeekAgo = 0;
        let totalMarketCapSixMonthsAgo = 0;
        let totalMarketCapOneMonthAgo = 0;
        let totalMarketCapOneYearAgo = 0;
        let totalMarketCapThreeMonthsAgo = 0;
        let totalMarketCapAllTime = 0

        // Calculate total market cap for each time period
        collectiblesData.forEach((collectible) => {
            const price = Number(collectible?.metrics?.floor_price);

            // Ensure price is defined
            if (price !== null) {
                // const quantity = 1;
                const quantity = Number(collectible?.total_issued)

                const marketCap = price * quantity;
                totalMarketCap += marketCap;

                const oneDayChange = collectible?.metrics?.one_day_change;
                const oneWeekChange = collectible?.metrics?.one_wk_change;
                const sixMonthChange = collectible?.metrics?.six_mo_change;
                const oneMonthChange = collectible?.metrics?.one_mo_change;
                const threeMonthChange = collectible?.metrics?.three_mo_change;
                const oneYearChange = collectible?.metrics?.one_year_change;
                const allTimeChange = collectible?.metrics?.all_time_change;

                if (oneDayChange !== null) {
                    totalMarketCapOneDayAgo += (price - oneDayChange) * quantity;
                }

                if (oneWeekChange !== null) {
                    totalMarketCapOneWeekAgo += (price - oneWeekChange) * quantity;
                }

                if (oneMonthChange !== null) {
                    totalMarketCapOneMonthAgo += (price - oneMonthChange) * quantity;
                }

                if (threeMonthChange !== null) {
                    totalMarketCapThreeMonthsAgo += (price - threeMonthChange) * quantity;
                }

                if (sixMonthChange !== null) {
                    totalMarketCapSixMonthsAgo += (price - sixMonthChange) * quantity;
                }

                if (oneYearChange !== null) {
                    totalMarketCapOneYearAgo += (price - oneYearChange) * quantity;
                }

                if (allTimeChange !== null){
                    totalMarketCapAllTime += (price - allTimeChange) * quantity;
                }

            }
        });

        // Calculate percentage changes
        const percentageChangeOneDay = ((totalMarketCap - totalMarketCapOneDayAgo) / totalMarketCapOneDayAgo) * 100;
        const percentageChangeOneWeek = ((totalMarketCap - totalMarketCapOneWeekAgo) / totalMarketCapOneWeekAgo) * 100;
        const percentageChangeOneMonth = ((totalMarketCap - totalMarketCapOneMonthAgo) / totalMarketCapOneMonthAgo) * 100;
        const percentageChangeOneYear = ((totalMarketCap - totalMarketCapOneYearAgo) / totalMarketCapOneYearAgo) * 100;
        const percentageChangeSixMonths = ((totalMarketCap - totalMarketCapSixMonthsAgo) / totalMarketCapSixMonthsAgo) * 100;
        const percentageChangeThreeMonths = ((totalMarketCap - totalMarketCapThreeMonthsAgo) / totalMarketCapThreeMonthsAgo) * 100;
        const percentageChangeAllTime = ((totalMarketCap - totalMarketCapAllTime) / totalMarketCapAllTime) * 100


        // Return the calculated percentage changes
        return {
            totalMarketCap,
            percentageChangeOneDay,
            percentageChangeOneWeek,
            percentageChangeSixMonths,
            percentageChangeOneMonth,
            percentageChangeOneYear,
            percentageChangeThreeMonths,
            percentageChangeAllTime
        };
    } catch (error) {
        console.error('Error calculating total market cap:', error);
        throw error;
    }
}
const calculateVeve = async (id) => {
    console.log('[CALCULATING VEVE METRICS]')

    try {

        // Calculate the sum of total_listings
        const totalListingsSum = await prisma.veve_collectibles_metrics.aggregate({
            _sum: {
                total_listings: true,
            },
        });

        const volumeSum = await prisma.veve_collectibles_metrics.aggregate({
            _sum: {
                volume: true
            }
        })

        // const averageChanges = await prisma.veve_collectibles_metrics.aggregate({
        //     _avg: {
        //         circulating_supply: true,
        //     },
        // });

        // Get the count of all veve_tokens
        const veveTokensCount = await prisma.veve_tokens.count();

        // Get the count of veve_wallets that have at least one veve_token assigned
        const veveWalletsWithTokensCount = await prisma.veve_wallets.count({
            where: {
                veve_tokens: {
                    some: {},
                },
            },
        });

        // Get the total number of veve_wallets
        const veveWalletsCount = await prisma.veve_wallets.count();

        // Get the count of all veve_mints
        const veveMintsCount = await prisma.veve_mints.count();

        // Get the count of all veve_transfers
        const veveTransfersCount = await prisma.veve_transfers.count()

        const veveTotals = await getVeveTotals()

        const saveObj = {
            market_cap: parseFloat(veveTotals.totalMarketCap),
            one_day_change: veveTotals.percentageChangeOneDay,
            one_mo_change: veveTotals.percentageChangeOneMonth,
            one_wk_change: veveTotals.percentageChangeOneWeek,
            one_year_change: veveTotals.percentageChangeOneYear,
            six_mo_change: veveTotals.percentageChangeSixMonths,
            three_mo_change: veveTotals.percentageChangeThreeMonths,
            total_listings: totalListingsSum._sum.total_listings,
            token_count: veveTokensCount,
            mint_count: veveMintsCount,
            transfer_count: veveTransfersCount,
            unique_holders: veveWalletsWithTokensCount,
            total_wallets: veveWalletsCount,
            volume: volumeSum._sum.volume,
            all_time_change: veveTotals.percentageChangeAllTime
        }

        await prisma.projects_metrics.upsert({
            where: {
                project_id: id,
            },
            update: saveObj,
            create: {
                project_id: id,
                ...saveObj
            },
        })

    } catch (e) {
        console.log('[FAILED]: ', e)
    }

}

const calculateMcfarlane = (id) => {
    console.log('[CALCULATING MCFARLANE METRICS]')
}

export const CALCULATE_PROJECT_METRICS = async () => {
    console.log('[CALCULATING PROJECT METRICS]')

    const projects = await prisma.projects.findMany({
        where: { active: true }
    })

    projects.map(async project => {
        const {id} = project

        switch (id) {
            case 'de2180a8-4e26-402a-aed1-a09a51e6e33d':
                await calculateVeve(id)
                break;
            case '99ff1ba5-706d-4d15-9f3d-de4247ac3a7b':
                await calculateMcfarlane(id)
                break;
            default:
                console.log('[ERROR] NO PROJECTS FOUND')
                break
        }

    })
}

CALCULATE_PROJECT_METRICS()