import * as path from "path"
import * as fs from "fs"
import * as cloudinary from 'cloudinary'
import {ApolloError, AuthenticationError} from "apollo-server-express";

export const fileUploadResolvers = {
    fileUpload: async (_, { file }, { userInfo, prisma }) => {

        console.log('userInfo is: ', userInfo)

        const { createReadStream, filename } = await file.file

        cloudinary.v2.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        })

        try{
            // const result = await new Promise((resolve, reject) => {
            //     createReadStream().pipe(cloudinary.v2.uploader.upload_stream((error, result) => {
            //         if (error) {
            //             reject(error)
            //         }
            //
            //         resolve(result)
            //     }))
            // })

            // console.log('result is: ', result)
            // console.log('secure url is: ', result.secure_url)

            console.log('userInfo is: ', userInfo)

            // const user = await prisma.users.findUnique({
            //     where: {
            //         id: userInfo.user_id
            //     }
            // })
        } catch (e) {
            throw new ApolloError('There was an issue uploading your avatar.')
        }


        // const stream = createReadStream()
        // const uniqueName = filename // TODO: Sanitise the name
        // const __dirname = path.resolve(path.dirname(''))
        // const pathName = path.join(__dirname, `./uploads/avatars/1/${uniqueName}`)
        // await stream.pipe(fs.createWriteStream(pathName))

        return {
            success: true,
            message: 'This mutation works.'
        }
    }
}