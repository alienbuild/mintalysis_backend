import validator from "validator"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import {GraphQLError} from "graphql"
import {sendMagicLink} from "../utils/sendMagicLink.js"

const resolvers = {
    Mutation: {
        signup: async (_, { credentials }, { prisma }) => {

            const { email } = credentials

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
                return {
                    userErrors: [{ message: "This email is already registered."}],
                    token: null
                }
            }

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
                await sendMagicLink({ email, token })

                return {
                    userErrors: [],
                    success: true,
                    domain: email.match(/(?<=@)[^.]+(?=\.)/g)[0]
                }

            } catch (e) {
                throw new GraphQLError('Unable to register the user.')
            }

        },
        signin: async (_, { credentials }, { prisma }) => {
            const { email } = credentials

            const user = await prisma.users.findUnique({
                where: {
                    email
                }
            })

            if (!user) {
                return {
                    userErrors: [{ message: "Invalid credentials." }],
                    token: null
                }
            }

            try {

                const token = jwt.sign({ userId: user.id }, process.env.JSON_SIGNATURE, { expiresIn: "1d" })
                await sendMagicLink({ email, token })

                return {
                    userErrors: [],
                    success: true,
                    domain: email.match(/(?<=@)[^.]+(?=\.)/g)[0]
                }

            } catch (e) {
                throw new GraphQLError('Unable to login in the user.')
            }

        }
    },
}

export default resolvers