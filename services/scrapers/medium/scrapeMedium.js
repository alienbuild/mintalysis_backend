import slugify from "slugify";

const chatGptKey = "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"

import axios from 'axios'
import {PrismaClient} from "@prisma/client";
import {setTimeout} from "node:timers/promises";

import { ChatGPTAPI } from 'chatgpt'
import crypto from "crypto";

import ShortUniqueId from 'short-unique-id';


const prisma = new PrismaClient()

const getUserId = async () => {

    // alexg_52065 = bd5ca2abd118
    // veve-digital-collectibles = beb3c1f88bbf
    // .VeVe = 6a2aab50eb75
    // VeVe- = 26052f25d63c

    const options = {
        method: 'GET',
        url: 'https://medium2.p.rapidapi.com/user/id_for/VeVe-',
        headers: {
            'X-RapidAPI-Key': 'f6cb6e41d0mshe6bc5b04dd3fdfcp1d254ajsnbaeff0c0aabf',
            'X-RapidAPI-Host': 'medium2.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }
}

const scrapeMedium = async () => {

    const options = {
        method: 'GET',
        url: 'https://medium2.p.rapidapi.com/user/26052f25d63c/articles',
        headers: {
            'X-RapidAPI-Key': 'f6cb6e41d0mshe6bc5b04dd3fdfcp1d254ajsnbaeff0c0aabf',
            'X-RapidAPI-Host': 'medium2.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);

        const setID = (item) => {
            return {"article_id": item};
        }

        const output = response.data.associated_articles.map(setID);
        // console.log('output is: ', output)

        const save = await prisma.tmp_medium_article_ids.createMany({
            data: output
        })
        console.log('save is: ', save)

    } catch (error) {
        console.error(error);
    }

}

const getArticleHTML = async () => {

    const getArticleIds = await prisma.tmp_medium_article_ids.findMany()

    getArticleIds.map(async (article, index) => {

        try {

            await setTimeout(5000 * index)
            console.log('[WAITING 5 SECONDS]')

            const response = await axios.request({
                method: 'GET',
                url: `https://medium2.p.rapidapi.com/article/${article.article_id}/html`,
                params: {fullpage: 'false'},
                headers: {
                    'X-RapidAPI-Key': 'f6cb6e41d0mshe6bc5b04dd3fdfcp1d254ajsnbaeff0c0aabf',
                    'X-RapidAPI-Host': 'medium2.p.rapidapi.com'
                }
            });

            const getArticleInfo = await axios.request({
                method: 'GET',
                url: `https://medium2.p.rapidapi.com/article/${article.article_id}`,
                headers: {
                    'X-RapidAPI-Key': 'f6cb6e41d0mshe6bc5b04dd3fdfcp1d254ajsnbaeff0c0aabf',
                    'X-RapidAPI-Host': 'medium2.p.rapidapi.com'
                }
            })

            await prisma.tmp_medium_article_html.create({
                data: {
                    article_id: article.article_id,
                    html: response.data.html,
                    date: getArticleInfo.data.published_at,
                    title: getArticleInfo.data.title,
                    subtitle: getArticleInfo.data.subtitle,
                    image: getArticleInfo.data.image_url
                }
            })

            console.log('[SAVED MEDIUM ARTICLE]: ', article.article_id)

        } catch (error) {
            console.error('[ERROR] Unable to get article HTML ', article.article_id);
        }

    })


}

const rewriteArticles = async () => {

    const articles = await prisma.tmp_medium_article_html.findMany({
        where: {
            updated_html: null
        }
    })

    const chatgpt = new ChatGPTAPI({
        apiKey: chatGptKey
    })

    articles.map(async (article, index) => {
        try {

            await setTimeout(120000 * index)
            console.log('[WAITING 120 SECONDS]')

            const message = `Reword the below article and include the images.\n ${article.html}`
            console.log('[REWRITING ARTICLE...]', article.article_id)
            const rewrite = await chatgpt.sendMessage(message)
            // const expand = await chatgpt.sendMessage(`continue`, {
            //     parentMessageId: rewrite.id
            // })

            const firstSeg = rewrite.text

            await setTimeout(1000 * index)
            console.log('[REWRITING TITLE...]', article.article_id)
            const title = await chatgpt.sendMessage(`rewrite the below title\n ${article.title}`)
            await setTimeout(1000 * index)
            console.log('[REWRITING SUBTITLE...]', article.article_id)
            const subtitle = await chatgpt.sendMessage(`rewrite the below subtitle\n ${article.subtitle}`)

            await prisma.tmp_medium_article_html.update({
                where: {
                    article_id: article.article_id
                },
                data: {
                    updated_html: firstSeg,
                    title: title.text,
                    subtitle: subtitle.text
                }
            })

            console.log(`[ARTICLE UPDATED] `, article.article_id)

        } catch (e) {
            console.log('[FAILED]: ', e)
        }
    })
}

const addHTML2Articles = async () => {

    const articles = await prisma.tmp_medium_article_html.findMany({
        where: {
            semantic_html: null
        }
    })

    const chatgpt = new ChatGPTAPI({
        apiKey: chatGptKey
    })

    articles.map(async (article, index) => {
        try {

            // if (index > 0) return

            await setTimeout(120000 * index)
            console.log('[WAITING 120 SECONDS]')

            const message = `rewrite the below article in semantic html5 do not include the html, body, main, head tags or comments in the results.\n ${article.updated_html}`
            console.log('[ADDING HTML5]', article.article_id)
            const addHtml = await chatgpt.sendMessage(message)


            const finishReason = addHtml.detail.choices[0].finish_reason
            if (finishReason === 'length'){
                console.log('[CHATGPT PAUSED DUE TO LENGTH, GRABBING MORE...')
                await setTimeout(120000 * index)
                const expand = await chatgpt.sendMessage(`continue`, {
                    parentMessageId: addHtml.id
                })
                const output = addHtml.text
                const result = output.concat(expand.text)

                await prisma.tmp_medium_article_html.update({
                    where: {
                        article_id: article.article_id
                    },
                    data: {
                        semantic_html: result,
                    }
                })

                console.log(`[ARTICLE UPDATED] `, article.article_id)

            } else {
                await prisma.tmp_medium_article_html.update({
                    where: {
                        article_id: article.article_id
                    },
                    data: {
                        semantic_html: addHtml.text,
                    }
                })

                console.log(`[ARTICLE UPDATED] `, article.article_id)
            }

        } catch (e) {
            console.log('[FAILED]: ', e)
        }
    })
}

const migrateTmpArticles = async () => {

    const articles = await prisma.tmp_medium_article_html.findMany({
        skip: 1
    })

    try {

        articles.map(async (article, index) => {

            // if (index > 0) return // TEST - REMOVE WHEN READY TO GO.

            // await setTimeout(1000 * index)
            const uid = new ShortUniqueId({ length: 4 })

            const save = await prisma.article.create({
                data: {
                    slug: slugify(`${article.title} - ${uid()}`),
                    publishedAt: new Date(article.date),
                    published: true,
                    project_id: "de2180a8-4e26-402a-aed1-a09a51e6e33d", // VEVE = de2180a8-4e26-402a-aed1-a09a51e6e33d
                    author_id: "771849d5-5701-452a-b4ae-a67ddfe92fe3", // MINTALYSIS USER ID
                    image: article.image,
                    translations: {
                        create: {
                            title: article.title,
                            subtitle: article.subtitle,
                            content: article.semantic_html,
                            language: "EN"
                        }
                    },
                },
                select: {
                    translations: true
                }
            })

            console.log(`[SAVED ARTICLE] `)
        })

    } catch (e) {
        console.log('[FAILED MIGRATION]: ', e)
    }

}

const translateArticles = async () => {

    const articles = await prisma.article.findMany({
        select: {
            translations: {
                where: {
                    language: "EN"
                }
            }
        }
    })

    console.log('articles is: ', articles)

    const chatgpt = new ChatGPTAPI({
        apiKey: chatGptKey
    })

    articles.map(async (article, index) => {

        const translateTo = "Chinese"
        const translationKey = "CN" // ES, DE, FR, CN, IN, IT

        try {
            if (index > 0) return

            await setTimeout(120000 * index)
            console.log('[WAITING 120 SECONDS]')

            // BELOW WONT WORK YOU NEED TO CHANGE TITLE TO ACCESS THE TRANSLATION RELATION ETC
            // const title = await chatgpt.sendMessage(`rewrite the below title in ${translateTo}\n ${article.title}`)
            // await setTimeout(3000 * index)
            // const subtitle = await chatgpt.sendMessage(`rewrite the below subtitle in ${translateTo}\n ${article.subtitle}`)
            // await setTimeout(3000 * index)
            //
            // const message = `rewrite the below article in ${translateTo} .\n ${article.updated_html}`
            // console.log('[ADDING HTML5]', article.article_id)
            // const translation = await chatgpt.sendMessage(message)
            // const finishReason = translation.detail.choices[0].finish_reason
            //
            // if (finishReason === 'length'){
            //     console.log('[CHATGPT PAUSED DUE TO LENGTH, GRABBING MORE...')
            //     await setTimeout(120000 * index)
            //     const expand = await chatgpt.sendMessage(`continue`, {
            //         parentMessageId: translation.id
            //     })
            //     const output = translation.text
            //     const result = output.concat(expand.text)
            //
            //     await prisma.tmp_medium_article_html.update({
            //         where: {
            //             article_id: article.article_id
            //         },
            //         data: {
            //             translations: {
            //                 create: {
            //                     data: {
            //                         content: result,
            //                         title: title.text,
            //                         language: translationKey
            //                     }
            //                 }
            //             }
            //         }
            //     })
            //
            //     console.log(`[ARTICLE UPDATED] `, article.id)
            //
            // } else {
            //     await prisma.article.update({
            //         where: {
            //             id: article.id
            //         },
            //         data: {
            //             translations: {
            //                 create: {
            //                     data: {
            //                         content: translation.text,
            //                         title: title.text,
            //                         language: translationKey
            //                     }
            //                 }
            //             }
            //         }
            //     })
            //     console.log(`[ARTICLE UPDATED] `, article.id)
            // }

        } catch (e) {
            console.log('[FAILED]: ', e)
        }
    })

}

migrateTmpArticles()
// addHTML2Articles()
// rewriteArticles()
// getUserId()
// scrapeMedium()
// getArticleHTML()