import {GraphQLError} from "graphql";

const verifyMarketListingQuery = (prisma, collectible_id, edition) => {
    return `query marketListingFromCollectibleType {
    marketListingFromCollectibleType(first: 10, filterOptions: { collectibleTypeId: "${collectible_id}", editionFrom: ${edition}, editionTo: ${edition} }) {
        pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
        }
        edges{
            node{
                id
                issueNumber
                sellerId
                sellerName
                price
            }
        }
    }
}`
}

export const VEVE_VERIFY_USER = async (prisma, meta) => {
    try {
        const { userId, verification_code, collectible_id, edition } = meta;

        const response = await fetch('https://web.api.prod.veve.me/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'cookie': "veve=s%3AAUbLV_hdwqgSds39ba-LlSIWPctzMBvz.jqXB%2BtkpAX7pk3gAPUIXNfWJbJuasxn0HNolxuGRsKI",
                'client-name': 'veve-web-app',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'client-operation': 'AuthUserDetails',
            },
            body: JSON.stringify({
                query: verifyMarketListingQuery(collectible_id, edition),
            }),
        });

        const listing_data = await response.json();

        const listingEdges = listing_data?.data?.marketListingFromCollectibleType?.edges[0];
        if (!listingEdges) return false;

        const listing = listingEdges.node;
        if (listing.issueNumber === Number(edition) && listing.price === verification_code.toString()) {

            try {
                await prisma.veve_profile.update({
                    where: {
                        userId
                    },
                    data: {
                        verified: true
                    }
                })

                return true;
            } catch (e) {
                throw new GraphQLError('Unable to save the user verification')
            }

        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
};
