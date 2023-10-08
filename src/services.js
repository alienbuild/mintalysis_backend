import { PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import Slack from '@slack/bolt';
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Prisma
export const prisma = new PrismaClient({
    log: ['query', 'error', 'info', 'warn'],
});

// Initialize PubSub
export const pubsub = new PubSub();

// Initialize Slack
export const slack = new Slack.App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN
});
