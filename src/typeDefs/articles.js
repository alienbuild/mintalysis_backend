import gql from 'graphql-tag'

const typeDefs = gql`
    type Query {
        getArticles: Boolean
    }
    
    type Mutation {
        createArticle(payload: CreateArticlePayload!): Boolean
        addArticleTranslations(payload: CreateArticleTranslationsPayload!) : Boolean
    }
    
    input CreateArticlePayload {
        article_id: Int
        author_id: String
        title: String! 
        content: String!
        image: String
        language: String
        publishedAt: DateTime
        project_id: String
    }
    
    input CreateArticleTranslationsPayload {
        article_id: Int!
        translations: [ArticleTranslation]!
    }
    
    input ArticleTranslation {
        content: String!
        title: String!
        language: String!
    }
`

export default typeDefs