import * as cloudinary from "cloudinary";

const resolvers = {
    Query: {
        getCollection: (_, { id }, { prisma }) => {
            return prisma.user_collection.findUnique({
                where: { id },
                include: { collectibles: true },
            });
        },
        getCollections: (_, { page = 1, limit = 10 }, { prisma }) => {
            return prisma.user_collection.findMany({
                skip: (page - 1) * limit,
                take: limit,
                include: { collectibles: true },
            });
        },
        getCollectible: (_, { id }, { prisma }) => {
            return prisma.physical_collectible.findUnique({
                where: { id },
            });
        },
    },
    Mutation: {
        addCollection: async (_, {name, description, image}, {prisma, userInfo}) => {
            let image_url = null;

            if (image) {
                const {createReadStream} = await image.promise;
                const folderName = `${userInfo.sub}`;
                image_url = await uploadImageToCloudinary(createReadStream(), folderName);
            }

            return prisma.userCollection.create({
                data: { name, description, image_url, user_id: userInfo.sub },
            });
        },
        updateCollection: (_, { id, name, description, image_url }, { prisma }) => {
            return prisma.user_collection.update({
                where: { id },
                data: { name, description, image_url },
            });
        },
        deleteCollection: (_, { id }, { prisma }) => {
            return prisma.user_collection.delete({
                where: { id },
            }).then(() => true).catch(() => false);
        },
        addCollectible: (_, { name, description, collectionId }, { prisma }) => {
            return prisma.physical_collectible.create({
                data: { name, description, collectionId },
            });
        },
        updateCollectible: (_, { id, name, description }, { prisma }) => {
            return prisma.physical_collectible.update({
                where: { id },
                data: { name, description },
            });
        },
        deleteCollectible: (_, { id }, { prisma }) => {
            return prisma.physical_collectible.delete({
                where: { id },
            }).then(() => true).catch(() => false);
        },
    },
}

const uploadImageToCloudinary = async (fileStream, folderName) => {
    try {
        const result = await new Promise((resolve, reject) => {
            const streamLoad = cloudinary.v2.uploader.upload_stream(
                {
                    folder: folderName,
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );

            fileStream.pipe(streamLoad);
        });

        return result.secure_url;
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        throw new Error('Unable to upload image to Cloudinary');
    }
};


export default resolvers