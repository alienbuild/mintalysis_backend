import validator from "validator"
import jwt from "jsonwebtoken"
import {GraphQLError} from "graphql"
import {sendMagicLink} from "../utils/sendMagicLink.js"

const resolvers = {
    Query: {
        validate: async (_, __, { ipAddress, userAgent, userInfo, prisma }) => {

            try {
                await prisma.login_history.create({
                    data: {
                        browser: userAgent,
                        ip_address: ipAddress,
                        user_id: userInfo.sub
                    }
                })

                return true

            } catch (e) {
                return false
            }


        }
    },
    Mutation: {
        auth: async (_, { credentials }, { prisma }) => {

            const { email, mobile } = credentials

            const isEmail = validator.isEmail(email)
            if (!isEmail) {
                return {
                    userErrors: [{message: "Invalid email address."}],
                    token: null
                }
            }

            const userExists = await prisma.User.findUnique({
                where: {
                    email: email
                }
            })
            if (userExists){
                const token = jwt.sign({ userId: userExists.id, username: userExists.username, role: userExists.role }, process.env.JSON_SIGNATURE, { expiresIn: "28d" })
                await sendMagicLink({ email, mobile, token })

                return {
                    userErrors: [],
                    success: true,
                    domain: email.match(/(?<=@)[^.]+(?=\.)/g)[0]
                }
            } else {
                try {

                    const user = await prisma.User.create({
                        data: {
                            email,
                        }
                    })

                    await prisma.profile.create({
                        data: {
                            user_id: user.id
                        }
                    })

                    const token = jwt.sign({ userId: user.id, username: userExists.username }, process.env.JSON_SIGNATURE, { expiresIn: "28d" })
                    await sendMagicLink({ email, mobile, token })

                    return {
                        userErrors: [],
                        success: true,
                        domain: email.match(/(?<=@)[^.]+(?=\.)/g)[0]
                    }

                } catch (e) {
                    throw new GraphQLError('Unable to register the user.')
                }
            }

        },
    },
}

export default resolvers