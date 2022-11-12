import * as cloudinary from 'cloudinary'
import { ApolloError } from "apollo-server-express"

export const fileUploadResolvers = {
    avatarUpload: async (_, { file }, { userInfo, prisma }) => {

        const { createReadStream } = await file.file

        cloudinary.v2.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        })

        try{
            const result = await new Promise((resolve, reject) => {
                createReadStream().pipe(cloudinary.v2.uploader.upload_stream((error, result) => {
                    if (error) {
                        reject(error)
                    }

                    resolve(result)
                }))
            })

            // TODO: Remove users old image from cloudinary to free up space.
            // TODO: Add Amazons Image Rekognition to cloudinary for image moderation (nudity prevention etc)
            // https://cloudinary.com/documentation/aws_rekognition_ai_moderation_addon
            const user = await prisma.profile.update({
                data: {
                    avatar: result.secure_url
                },
                where: {
                    user_id: userInfo.userId
                }
            })

            if (!user){
                return {
                    success: false,
                    message: 'File upload failed as the user was not found.',
                }
            } else {
                return {
                    success: true,
                    message: 'File upload success.',
                    token: result.secure_url
                }
            }

        } catch (e) {
            throw new ApolloError('There was an issue uploading your avatar.')
        }


    }
}