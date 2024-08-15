import {MyContext} from "../index";
import {backToStart} from "./menu";
import {Toucan} from "toucan-js";

export async function handleException(e: any, ctx: MyContext) {
    await ctx.session
    const sentry = new Toucan({
        environment: ctx.config.env ?? 'production',
        dsn: ctx.config.dsn,
        ctx
    });

    sentry.setExtra('message', ctx.message)
    sentry.setExtra('session', ctx.session)
    sentry.setExtra('conversation', ctx?.conversation)
    sentry.captureException(e);

    if (e.error_code == 403 && e.description == 'Forbidden: bot was blocked by the user') {
        // that's fine - let him go...
    } else {
        console.log(e)
        const text = [
            'Мати Василева!',
            'Хай тобі грець!',
            'Йосип голий!',
            'Якого біса?!',
            'Холера ясна!',
        ]
        const rand = text[Math.floor(Math.random() * text.length)];

        await backToStart(ctx, `${rand}\nВибачте, сталась помилка. Наші люди вже в курсі і намагаються виправити її.\nСпробуйте виконати команду /cancel та зробити ще одну спробу.`)
    }
}