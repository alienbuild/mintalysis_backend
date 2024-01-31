import { PrismaClient } from "@prisma/client";
import { withAccelerate } from '@prisma/extension-accelerate'
import { PubSub } from "graphql-subscriptions";
import Slack from '@slack/bolt';
import * as dotenv from "dotenv";
import {MeiliSearch} from "meilisearch";

dotenv.config();

// Initialize Prisma
// export const prisma = new PrismaClient();
export const prisma = new PrismaClient().$extends(withAccelerate())

// Initialize PubSub
export const pubsub = new PubSub();

// Initialize Slack
export const slack = new Slack.App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN
});

// Initialize MeiliSearch
export const meili = new MeiliSearch({
    host: 'http://67.225.248.251:7700',
    apiKey: process.env.MEILISEARCH_KEY
});