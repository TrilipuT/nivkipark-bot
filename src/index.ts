/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler deploy src/index.ts --name my-worker` to deploy your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import {
    Bot,
    webhookCallback,
    lazySession,
    Context,
    LazySessionFlavor
} from "grammy/web";
import {
    type ConversationFlavor,
    conversations,
} from "@ponomarevlad/grammyjs-conversations";
import {KvAdapter} from '@grammyjs/storage-cloudflare';
import {hydrate, HydrateFlavor} from "@grammyjs/hydrate";
import greeting from "./conversations/greeting";
import requests from "./conversations/request";
import myVehicles from "./conversations/myVehicles";
import auth from "./helpers/auth";
import {backToStart, MENU_CANCEL, MENU_MY_VEHICLES, MENU_REQUESTS_LIST, MENU_REQUESTS_NEW,} from "./helpers/menu";
import {isAuthenticated} from "./helpers/auth";
import {blockedLogger} from "./helpers/errors";
import {Toucan} from "toucan-js";

export interface Env {
    BOT_TOKEN: string
    KV: KVNamespace<string>
    ENVIRONMENT: string
    SENTRY_DSN: string
}

interface SessionData {
    contact: {
        phone_number: string,
        first_name: string,
        last_name: string,
        user_id: number
    },
    building: string,
    flat: string
}

export type MyContext = Context & LazySessionFlavor<SessionData> & ConversationFlavor & HydrateFlavor<Context> & {
    config: { env: String, sentry: Toucan }
};

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {

        const sentry = new Toucan({
            environment: env?.ENVIRONMENT,
            dsn: env.SENTRY_DSN,
            release: '1.0.0',
            ctx,
            request,
        });
        const bot = new Bot<MyContext>(env.BOT_TOKEN)
        try {
            bot.use(async (ctx, next) => {
                ctx.config = {
                    env: env?.ENVIRONMENT ?? '',
                    sentry: sentry
                };
                await next();
            });
            bot.use(hydrate());
            bot.use(lazySession({
                storage: new KvAdapter<SessionData>(env.KV),
                initial: () => ({
                    contact: {
                        phone_number: '',
                        first_name: '',
                        last_name: '',
                        user_id: 0
                    },
                    building: '',
                    flat: ''
                }),
            }))
            bot.use(conversations())

            // Conv

            bot.use(greeting)
            bot.use(requests)
            bot.use(myVehicles)
            bot.use(auth)


            bot.command("cancel", async (ctx) => {
                await ctx.conversation.exit()
                await backToStart(ctx)
            })

            bot.command("start", async (ctx) => {
                await ctx.session
                // @ts-ignore
                if (ctx.session.contact?.phone_number && ctx.session.building && ctx.session.flat) {
                    await backToStart(ctx)
                } else {
                    await ctx.conversation.enter("greeting")
                }
            })


            bot.filter(ctx => ctx.msg?.text == MENU_CANCEL,
                async (ctx, next) => {
                    // Cancel
                    await ctx.conversation.exit()
                    await ctx.reply('Ок, відміняємо.')
                    if (await isAuthenticated(ctx)) {
                        await backToStart(ctx)
                    }
                })


        } catch (e: any) {
            sentry.captureException(e);
        }
        return webhookCallback(bot, "cloudflare-mod")(request)
    },
};
