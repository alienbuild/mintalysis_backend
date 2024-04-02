import DataLoader from 'dataloader';
import {getUserFromToken} from "./utils/getUserFromToken.js";
import {batchCollectibles} from "./loaders/collectibleLoader.js";
import {meili, prisma, pubsub, slack} from "./services.js";
import {batchUsers} from "./loaders/userLoader.js";
import {batchComics} from "./loaders/comicLoader.js";
import {transferLoader} from "./loaders/transferLoader.js";
import {batchWalletsByUserId} from "./loaders/walletLoader.js";
import {batchBrands} from "./loaders/brandsLoader.js";

export const createContext = async ({ req } = {}) => {

    let ipAddress = '';
    let userAgent = '';
    let token = '';

    if (req) { // Only attempt to read from `req` if it exists
        ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
        userAgent = req.headers["user-agent"];
        token = req.headers.authorization;
    }


    // const userInfo = await getUserFromToken(req.headers.authorization)

    const userInfo = await getUserFromToken(token)

    return {
        ipAddress,
        userAgent,
        userInfo,
        prisma,
        pubsub,
        slack,
        meili,
        loaders: {
            user: new DataLoader(keys => batchUsers(keys, prisma)),
            collectible: new DataLoader(keys => batchCollectibles(keys, prisma)),
            brands: new DataLoader(keys => batchBrands(keys, prisma)),
            comic: new DataLoader(keys => batchComics(keys, prisma)),
            transfer: transferLoader,
            wallet: new DataLoader(
                userIds => batchWalletsByUserId({ userIds, prisma }),
                { cacheKeyFn: key => key.toString() }
            ),
        },
    };
};
