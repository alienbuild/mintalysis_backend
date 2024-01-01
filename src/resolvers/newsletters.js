const resolvers = {
    Query: {
        getSubscriber: async (_, { email }, { prisma }) => {
            const subscriber = await prisma.newsletter_subscribers.findUnique({
                where: { email },
                include: { project_newsletters: { include: { projects: true } } },
            });

            if (!subscriber) throw new Error('Subscriber not found')

            return subscriber;
        },
        checkSubscription: async (_, { email, project_id }, { prisma }) => {
            const subscriberInDb = await prisma.newsletter_subscribers.findUnique({ where: { email } });
            if (subscriberInDb) {
                const subscription = await prisma.project_newsletters.findFirst({
                    where: {
                        project_id: project_id,
                        subscriber_id: subscriberInDb.id,
                    },
                });

                return Boolean(subscription);
            }
            return false;
        },
    },
    Mutation: {
        subscribeToGeneralNewsletter: async (_, { email }, { prisma, ipAddress }) => {
            console.log('ip address is: ', ipAddress)
            const subscriberInDb = await prisma.newsletter_subscribers.findUnique({ where: { email } });

            if (!subscriberInDb) {
                return await prisma.newsletter_subscribers.create({
                    data: {
                        email,
                        ip_address: ipAddress
                    }
                });
            } else {
                return subscriberInDb;
            }
        },
        subscribeToProjectNewsletter: async (_, { email, project_id }, { prisma }) => {
            const subscriberInDb = await prisma.newsletter_subscribers.findUnique({ where: { email } });

            if (!subscriberInDb) {
                const newSubscriber = await prisma.newsletter_subscribers.create({ data: { email } });

                await prisma.project_newsletters.create({
                    data: {
                        project_id: project_id,
                        subscriber_id: newSubscriber.id,
                    },
                });

                return newSubscriber;
            } else {
                await prisma.project_newsletters.create({
                    data: {
                        project_id: project_id,
                        subscriber_id: subscriberInDb.id,
                    },
                });

                return subscriberInDb;
            }
        },
    },
    NewsletterSubscriber: {
        newsletters: async (parent, _, { prisma }) => {
            return await prisma.project_newsletters.findMany({
                where: { subscriber_id: parent.id },
                include: { projects: true },
            });
        },
    },
}

export default resolvers