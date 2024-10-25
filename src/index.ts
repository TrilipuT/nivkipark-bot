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
import {D1Adapter} from '@grammyjs/storage-cloudflare';
import {hydrate, HydrateFlavor} from "@grammyjs/hydrate";
import greeting from "./conversations/greeting";
import requests from "./conversations/request";
import myVehicles from "./conversations/myVehicles";
import auth from "./helpers/auth";
import {backToStart, MENU_CANCEL} from "./helpers/menu";
import {isAuthenticated} from "./helpers/auth";
import {Toucan} from "toucan-js";
import addUser from "./conversations/newUser";

export interface Env {
    TOKEN: string
    KV: KVNamespace<string>
    DB: D1Database
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
    config: { env: String, dsn: String, sentry?: Toucan }
};

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {

        const mainBot = new Bot<MyContext>(env.TOKEN)
        const bot = mainBot.chatType("private")
        bot.use(async (ctx, next) => {
            ctx.config = {
                env: env?.ENVIRONMENT ?? 'production',
                dsn: env.SENTRY_DSN,
            };
            await next();
        });
        bot.use(hydrate());
        try {
            const grammyD1StorageAdapter = await D1Adapter.create<SessionData>(env.DB, 'GrammySessions')

            bot.use(lazySession({
                storage: grammyD1StorageAdapter,
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
            /*bot.use(async (ctx,next)=>{
                let rr = await isAuthenticated(ctx)
                if(rr){
                    console.log('pass')
                    await next()
                } else {
                    console.log('not pass')
                }


            })*/
            bot.use(async (ctx, next) => {
                // await ctx.replyWithChatAction('typing')
                if (ctx.config?.env != 'development') {
                    console.log(ctx.message)
                }
                await next();
            });
            bot.use(conversations())

            // Conv

            bot.use(greeting)
            bot.use(requests)
            bot.use(myVehicles)
            bot.use(addUser)
            bot.use(auth)


            bot.command("cancel", async (ctx) => {
                console.log('cancel')
                await ctx.conversation.exit()
                await backToStart(ctx)
            })

            bot.command("start", async (ctx) => {
                await ctx.session
                console.log('start')
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
                    console.log('menu cancel')
                    await ctx.conversation.exit()
                    await ctx.reply('Ок, відміняємо.')
                    if (await isAuthenticated(ctx)) {
                        await backToStart(ctx)
                    }
                })


        } catch (e: any) {
            const sentry = new Toucan({
                environment: env?.ENVIRONMENT,
                dsn: env.SENTRY_DSN,
                ctx,
                request,
            });
            sentry.captureException(e);
        }
        return webhookCallback(mainBot, "cloudflare-mod")(request)
    },
};
