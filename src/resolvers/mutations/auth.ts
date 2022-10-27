import validator from 'validator'
import { Context } from "../../index"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {JSON_SIGNATURE} from "../../keys"

interface SignupArgs {
    credentials: {
        email: string
        password: string
    }
}

interface SigninArgs {
    credentials: {
        email: string
        password: string
    }
}

interface UserPayload {
    userErrors: {
        message: string
    }[],
    token: string | null
}

export const authResolvers = {
    signup: async (_: any, { credentials }: SignupArgs, { prisma }: Context ): Promise<UserPayload> => {

        const { email, password } = credentials

        const isEmail = validator.isEmail(email)

        if (!isEmail) {
            return {
                userErrors: [{message: "Invalid email address."}],
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

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.users.create({
            data: {
                email,
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
            token: jwt.sign({ userId: user.id }, JSON_SIGNATURE, { expiresIn: "3d" })
        }

    },
    signin: async (_: any, { credentials }: SigninArgs, { prisma }: Context): Promise<UserPayload> => {
        const { email, password } = credentials

        const user = await prisma.users.findUnique({
            where: {
                email
            }
        })

        if (!user) {
            return {
                userErrors: [{message: "Invalid credentials."}],
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
            token: jwt.sign({ userId: user.id }, JSON_SIGNATURE, { expiresIn: '3d' })
        }

    }
}