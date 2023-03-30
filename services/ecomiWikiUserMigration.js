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

        if (!stripe_customer_id) return

        let subscriber = false
        if (subscriptions.length > 0) subscriber = true

        try {
            const newUser = await prisma.users.create({
                data: {
                    name,
                    email,
                    createdAt,
                    stripe_customer_id,
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