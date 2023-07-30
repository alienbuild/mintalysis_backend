import {GraphQLError} from "graphql";
import {slugify} from "../utils/index.js";

const resolvers = {
    Query: {
        getArticles: async (_, __, { prisma }) => {
            return true
        }
    },
    Mutation: {
        createArticle: async (_, { payload }, { userInfo, prisma }) => {

            // TODO: Make sure this is a protected route.

            let projectId

            if (!payload.category) throw new GraphQLError('Please provide a cateogry name.')
            if (!payload.language) payload.language === 'EN'
            if (payload.project_id) projectId = payload.project_id

            const article = await prisma.article.create({
                data: {
                    slug: slugify(payload.title),
                    projectId,
                    translations: {
                        create: {
                            title: payload.title,
                            content: payload.content,
                            language: payload.language
                        }
                    },
                },
                select: {
                    translations: {
                        where: {
                            language: payload.language
                        }
                    }
                }
            })

            console.log('article is: ', article)

            return true
        },
        addArticleTranslations: async (_, { payload }, { userInfo, prisma }) => {

            // TODO: Make sure this is a protected route.

            console.log('payload is: ', payload)

            const addTranslations = await prisma.article.update({
                where:{
                    id: payload.article_id
                },
                data: {
                    translations:{
                        createMany: {
                            data: payload.translations.map(translation => ({
                                content: translation.content,
                                title: translation.title,
                                language: translation.language
                            }))
                        }
                    }
                },
                select: {
                    translations: true
                }
            })

            console.log('addTranslations is: ', addTranslations)

            return true
        },
    }
}

export default resolvers