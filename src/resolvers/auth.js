import validator from "validator"
import jwt from "jsonwebtoken"
import {GraphQLError} from "graphql"
import {sendMagicLink} from "../utils/sendMagicLink.js"

const resolvers = {
    Mutation: {
        auth: async (_, { credentials }, { prisma }) => {
            console.log('HIT!', credentials)

            const { email, mobile } = credentials

            const isEmail = validator.isEmail(email)
            if (!isEmail) {
                return {
                    userErrors: [{message: "Invalid email address."}],
                    token: null
                }
            }

            const userExists = await prisma.users.findUnique({
                where: {
                    email: email
                }
            })
            if (userExists){
                const token = jwt.sign({ userId: userExists.id }, process.env.JSON_SIGNATURE, { expiresIn: "1d" })
                await sendMagicLink({ email, mobile, token })

                return {
                    userErrors: [],
                    success: true,
                    domain: email.match(/(?<=@)[^.]+(?=\.)/g)[0]
                }
            } else {
                try {

                    const user = await prisma.users.create({
                        data: {
                            email,
                        }
                    })

                    await prisma.profile.create({
                        data: {
                            user_id: user.id
                        }
                    })

                    const token = jwt.sign({ userId: user.id }, process.env.JSON_SIGNATURE, { expiresIn: "1d" })
                    await sendMagicLink({ email, mobile, token })

                    return {
                        userErrors: [],
                        success: true,
                        domain: email.match(/(?<=@)[^.]+(?=\.)/g)[0]
                    }

                } catch (e) {
                    console.log('[ERROR] Unable to register the user: ', e)
                    throw new GraphQLError('Unable to register the user.')
                }
            }

        },
    },
}

export default resolvers