import validator from "validator"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import {GraphQLError} from "graphql";

const resolvers = {
    Mutation: {
        signup: async (_, { credentials }, { prisma }) => {

            const { email, password, username } = credentials

            console.log(`email is: ${email}, password is: ${password}. username is: ${username}`)

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

            const isValidPassword = validator.isLength(password, { min: 7 })
            if (!isValidPassword){
                return {
                    userErrors: [{message: "Invalid password. Please provide a password greater than 7 characters."}],
                    token: null
                }
            }

            const isValidUsername = validator.isLength(username, { min: 3 })
            if (!isValidUsername){
                return {
                    userErors: [{message: "Username must be at least 3 characters in length."}],
                    token: null
                }
            }

            const hashedPassword = await bcrypt.hash(password, 10)

            try {

                const user = await prisma.users.create({
                    data: {
                        email,
                        username,
                        password: hashedPassword
                    }
                })

                await prisma.profile.create({
                    data: {
                        user_id: user.id
                    }
                })

                return {
                    userErrors: [],
                    token: jwt.sign({ userId: user.id, username: user.username }, process.env.JSON_SIGNATURE, { expiresIn: "3d" }),
                    user: {
                        id: user.id,
                        username: user.username
                    }
                }
            } catch (e) {
                throw new GraphQLError('Unable to register the user.')
            }


        },
        signin: async (_, { credentials }, { prisma }) => {
            const { email, password } = credentials

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

            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                return {
                    userErrors: [{message: "Invalid credentials."}],
                    token: null
                }
            }

            return {
                userErrors: [],
                token: jwt.sign({ userId: user.id, username: user.username }, process.env.JSON_SIGNATURE, { expiresIn: '3d' }),
                user: user
            }
        }
    },
}

export default resolvers