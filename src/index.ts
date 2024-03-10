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
    createConversation,
} from "@ponomarevlad/grammyjs-conversations";
import {KvAdapter} from '@grammyjs/storage-cloudflare';
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";

import {greeting} from "./greeting";
import {list, newRequest} from "./request";
import {backToStart, MENU_CANCEL, MENU_REQUESTS_LIST, MENU_REQUESTS_NEW,} from "./menu";


export interface Env {
    BOT_TOKEN: string
    KV: KVNamespace<string>
}

interface SessionData {
    contact: object,
    building: string,
    flat: string
}

export type MyContext = Context & LazySessionFlavor<SessionData> & ConversationFlavor & HydrateFlavor<Context>;

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        try {
            const bot = new Bot<MyContext>(env.BOT_TOKEN);
            bot.use(hydrate());
            bot.use(lazySession({
                storage: new KvAdapter<SessionData>(env.KV),
                initial: () => ({contact: {}, building: '', flat: ''}),
            }))
            bot.use(conversations());

            // Conv
            bot.use(createConversation(greeting));
            bot.use(createConversation(newRequest));


            bot.command("auth", async (ctx) => {
                await ctx.conversation.enter("greeting");
            })
            bot.command("cancel", async (ctx) => {
                await ctx.conversation.exit();
                await backToStart(ctx)
            })
            bot.command("start", async (ctx) => {
                await ctx.session
                // @ts-ignore
                if (ctx.session.contact?.phone_number && ctx.session.building && ctx.session.flat) {
                    await backToStart(ctx)
                } else {
                    await ctx.conversation.enter("greeting");
                }
            })
            bot.on("message:text", async (ctx) => {
                if (ctx.msg.text == MENU_REQUESTS_NEW) {
                    await ctx.conversation.enter("newRequest");
                } else if (ctx.msg.text == MENU_REQUESTS_LIST) {
                    await backToStart(ctx, await list(ctx))
                } else if (ctx.msg.text == MENU_CANCEL) {
                    await ctx.conversation.exit()
                    await backToStart(ctx)
                }
            })

            return webhookCallback(bot, "cloudflare-mod")(request);
        } catch (e: any) {
            return new Response(e.message);
        }
    },
};
