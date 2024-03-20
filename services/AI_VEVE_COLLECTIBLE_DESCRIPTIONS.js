// import { PrismaClient } from "@prisma/client"
// import { ChatGPTAPI } from 'chatgpt'
//
// const prisma = new PrismaClient()
// const chatGptKey = "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"
//
// const chatgpt = new ChatGPTAPI({
//     apiKey: chatGptKey,
//     completionParams: {
//         model: 'gpt-3.5-turbo',
//     }
// })
//
// const batchSize = 10;
// let skip = 0;
//
// export const AI_VEVE_COLLECTIBLE_DESCRIPTIONS = async () => {
//     console.log('Lets get them descriptions!')
//
//     while(true) {
//         const collectibles = await prisma.veve_collectibles.findMany({
//             where: {
//                 translations: {
//                     some: {
//                         language: "EN",
//                         ai_description: null
//                     }
//                 }
//             },
//             include: {
//                 brand: true,
//                 licensor: true,
//                 series: true,
//                 translations: {
//                     where: {
//                         language: "EN"
//                     }
//                 }
//             },
//             skip: skip,
//             take: batchSize
//         });
//
//         if (collectibles.length === 0) break;
//
//         for (const collectible of collectibles) {
//             console.log(`Calling ChatGPT 4 for ${collectible.name} - ${collectible.rarity}`);
//
//             const message = `
//             write a 300 to 500 word description for the image linked below.
//             ignore the background of the image and concentrate only on the collectible.
//             You can also use any of the other information below to help you.
//             FYI First public mint means the first mint number the public can get, all mint numbers
//             before are held by the Veve wallet. Also remove any 'used by permission' text.
//             image: ${collectible.image_url}
//             description: ${collectible.description}
//             store price: $${collectible.store_price}
//             total available: ${collectible.total_available}
//             drop date: ${collectible.drop_date}
//             edition type: ${collectible.edition_type}
//             rarity: ${collectible.rarity}
//             brand name: ${collectible.brand.name}
//             brand description: ${collectible.brand.description}
//             series name: ${collectible.series.name}
//             series description: ${collectible.series.description}
//             series season: ${collectible.series.season}
//             licensor name: ${collectible.licensor.name}
//             first public mint: ${collectible.first_public_mint}
//             licensor description: ${collectible.licensor.description}
//         `
//             const rewrite = await chatgpt.sendMessage(message)
//
//             const existingTranslation = await prisma.veve_collectibles_translations.findUnique({
//                 where: {
//                     language_collectible_id: {
//                         language: "EN",
//                         collectible_id: collectible.collectible_id,
//                     },
//                 },
//             });
//
//             if (existingTranslation) {
//                 await prisma.veve_collectibles_translations.update({
//                     where: {
//                         language_collectible_id: {
//                             language: "EN",
//                             collectible_id: collectible.collectible_id,
//                         },
//                     },
//                     data: {
//                         ai_description: rewrite.text,
//                     },
//                 });
//             } else {
//                 await prisma.veve_collectibles_translations.create({
//                     data: {
//                         collectible_id: collectible.collectible_id,
//                         name: collectible.name,
//                         edition_type: collectible.edition_type,
//                         rarity: collectible.rarity,
//                         ai_description: rewrite.text,
//                         description: collectible.description,
//                         language: "EN",
//                     },
//                 });
//             }
//
//             console.log('Waiting for 5 seconds...')
//
//             await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
//
//         }
//
//         skip += batchSize;
//
//     }
//
// }
//
// export const AI_VEVE_COLLECTIBLE_SEO_TAGS = async () => {
//     console.log('[ALICE] Processing veve collectibles for seo tags')
//
//     while(true) {
//
//         try {
//             const collectibles = await prisma.veve_collectibles.findMany({
//                 where: {
//                     translations: {
//                         some: {
//                             language: "EN",
//                             seo_title: null
//                         }
//                     }
//                 },
//                 include: {
//                     brand: true,
//                     licensor: true,
//                     series: true,
//                     translations: { where: { language: "EN" } }
//                 },
//                 skip: skip,
//                 take: batchSize
//             });
//
//             if (collectibles.length === 0) break;
//
//             for (const collectible of collectibles) {
//                 console.log(`Calling ChatGPT 3.5 for ${collectible.name} - ${collectible.rarity}`);
//                 const pre_seo_description = `
//                 write the meta_description meta data with a focus on collectibles for the product description below.
//                 Only return the resulting text, no html, no quotes, just string text results. Try to keep it below 158 characters.
//                 description: ${collectible.translations[0].ai_description}
//                 brand: ${collectible.brand.name}
//                 licensor: ${collectible.licensor.name}
//                 series: ${collectible.series.name}
//             `
//                 const seo_description = await chatgpt.sendMessage(pre_seo_description)
//                 console.log(`Got seo description for ${collectible.name} - ${collectible.rarity}`);
//
//                 const pre_seo_keywords = `
//                 write the meta_keywords metadata based on the product description below. Focus on collectibles.
//                 Only return the resulting text, no html, no quotes, just string text results.
//                 description: ${collectible.translations[0].ai_description}
//             `
//                 const seo_keywords = await chatgpt.sendMessage(pre_seo_keywords)
//                 console.log(`Got seo keywords for ${collectible.name} - ${collectible.rarity}`);
//
//                 const pre_seo_title = `
//                 write the seo title metadata based on the product title and description below.
//                 Only return the resulting text, no html, no quotes, just string text results.
//                 title: ${collectible.name}
//                 description: ${collectible.ai_description}
//             `
//                 const seo_title = await chatgpt.sendMessage(pre_seo_title)
//                 console.log(`Got seo title for ${collectible.name} - ${collectible.rarity}`);
//
//                 const pre_og_title = `
//                 write an og_title metadata based on the product title and description below.
//                 Only return the resulting text, no html, no quotes, just string text results.
//                 title: ${collectible.name}
//                 description: ${collectible.translations[0].ai_description}
//             `
//                 const og_title = await chatgpt.sendMessage(pre_og_title)
//                 console.log(`Got og title for ${collectible.name} - ${collectible.rarity}`);
//
//                 const pre_og_description = `
//                 write an og_description metadata based on the product title and description below.
//                 Only return the resulting text, no html, no quotes, just string text results.
//                 title: ${collectible.name}
//                 description: ${collectible.ai_description}
//             `
//                 const og_description = await chatgpt.sendMessage(pre_og_description)
//                 console.log(`Got og description for ${collectible.name} - ${collectible.rarity}`);
//
//                 const existingTranslation = await prisma.veve_collectibles_translations.findUnique({
//                     where: {
//                         language_collectible_id: {
//                             language: "EN",
//                             collectible_id: collectible.collectible_id,
//                         },
//                     },
//                 });
//
//                 if (existingTranslation) {
//                     await prisma.veve_collectibles_translations.update({
//                         where: {
//                             language_collectible_id: {
//                                 language: "EN",
//                                 collectible_id: collectible.collectible_id,
//                             },
//                         },
//                         data: {
//                             seo_description: seo_description.text,
//                             seo_keywords: seo_keywords.text,
//                             seo_title: seo_title.text,
//                             og_title: og_title.text,
//                             og_description: og_description.text
//                         },
//                     });
//                 } else {
//                     await prisma.veve_collectibles_translations.create({
//                         data: {
//                             collectible_id: collectible.collectible_id,
//                             name: collectible.name,
//                             edition_type: collectible.edition_type,
//                             rarity: collectible.rarity,
//                             seo_description: seo_description.text,
//                             seo_keywords: seo_keywords.text,
//                             seo_title: seo_title.text,
//                             og_title: og_title.text,
//                             og_description: og_description.text,
//                             language: "EN",
//                         },
//                     });
//                 }
//
//                 console.log(`[SUCCESS] SEO tags completed for ${collectible.name} - ${collectible.rarity} - Waiting for 2 seconds...`);
//                 await new Promise(resolve => setTimeout(resolve, 1000));
//
//             }
//
//         } catch (e) {
//             console.log('FAILED', e)
//         }
//
//         skip += batchSize;
//
//     }
// }
//
// // AI_VEVE_COLLECTIBLE_DESCRIPTIONS()
// AI_VEVE_COLLECTIBLE_SEO_TAGS()