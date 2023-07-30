import {PrismaClient} from "@prisma/client"
import mongoose from "mongoose";
import User from '../models/_LegacyUser.js'

const prisma = new PrismaClient()

// MongoDB Database
mongoose.connect(process.env.MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((e) => console.log('Error connecting to MongoDB', e))

const EcomiWikiUserMigration = async () => {
    console.log('Migrating users.')

    const cursor = User.find().batchSize(1000).cursor()
    let count = 0;

    await cursor.eachAsync(async (user) => {
        const { name, email, stripe_customer_id, createdAt, subscriptions } = user

        // if (!stripe_customer_id) return

        let subscriber = false
        if (subscriptions.length > 0) subscriber = true

        try {
            const newUser = await prisma.User.create({
                data: {
                    name,
                    username: generateFromEmail(email, 4),
                    email,
                    createdAt,
                    ecomiwiki_user: subscriber
                }
            })

            await prisma.profile.create({
                data: {
                    user_id: newUser.id
                }
            })

            console.log(`[SUCCESS] ${email} migrated to Mintalysis.`, count)
            count++

        } catch (e) {
            console.log(`[SKIPPING] ${email} `)
        }

    })

}

EcomiWikiUserMigration()

import { generateFromEmail, generateUsername } from "unique-username-generator";

const generateUsernames = async () => {
    const totalUserCount = await prisma.User.count()
    console.log('totalUserCount are: ', totalUserCount)

    for (let i = 0; i < totalUserCount; i++) {
        console.log('[PROCESSING] Batch: ', i + 1)

        const users = await prisma.User.findMany({
            skip: i * 10000,
            take: 10000
        })

        await users.map(async user => {
            const username = generateFromEmail(user.email, 4)

            try {

                await prisma.User.update({
                    where: { id: user.id },
                    data: { username }
                })

                console.log(`[SUCCESS] updated ${user.email} with ${username}`)

            } catch (e) {
                console.log(`[FAILED]: Could not update ${user.id}`, e)
            }
        })

        console.log(`[SUCCESS] Batch ${i + 1}`)

    }

}

// generateUsernames()