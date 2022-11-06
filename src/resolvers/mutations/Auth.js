import validator from "validator"
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"

export const authResolvers = {
    signup: async (_, { credentials }, { prisma }) => {

    const { email, password, username } = credentials

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

    if (!validator.isEmpty(username) || !validator.matches(username, '^[a-zA-Z0-9_.-]*$')){
        return {
            userErrors: [{message: "Username can only contain alphanumerical characters and can not be empty."}],
            token: null
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

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
        token: jwt.sign({ userId: user.id }, process.env.JSON_SIGNATURE, { expiresIn: "3d" }),
        user: {
            id: user.id,
            username: user.username
        }
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
            token: jwt.sign({ userId: user.id }, process.env.JSON_SIGNATURE, { expiresIn: '3d' }),
            user: {
                id: user.id,
                username: user.username
            }
        }
    }
}