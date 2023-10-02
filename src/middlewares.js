import {getUserFromToken} from "./utils/getUserFromToken.js";
import {prisma} from "./services.js";

export const lastSeenMiddleware = async (req, res, next) => {
    const token = req.headers.authorization;
    if(token) {
        try {
            const userInfo = await getUserFromToken(token);
            if(userInfo && userInfo.sub) {
                await prisma.User.update({
                    where: { id: userInfo.sub },
                    data: {
                        last_seen: new Date(),
                        status: 'ONLINE'
                    }
                });
            }
        } catch (error) {
            console.error('Error updating last_seen:', error);
        }
    }
    next();
};