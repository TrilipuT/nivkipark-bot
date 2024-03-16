import {Composer, Keyboard} from "grammy";
import {MyContext} from "../index";

const bot = new Composer<MyContext>();
export async function isAuthenticated(ctx:MyContext) {
    await ctx.session
    const isAuth = ctx.session.contact.phone_number && await ctx.session.building && await ctx.session.flat
    if (!isAuth) {
        ctx.reply('Щось я вас не впізнаю... Пройдіть авторизаію заново, будь ласка', {
            reply_markup: new Keyboard().text('/auth').resized().oneTime()
        })
    }
    return isAuth
}

bot.command("auth", async (ctx) => {
    await ctx.conversation.enter("greeting")
})

export default bot