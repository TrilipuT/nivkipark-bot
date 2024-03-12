import {Keyboard} from "grammy";

export async function isAuthenticated(ctx) {
    await ctx.session
    const isAuth = ctx.session.contact.phone_number && await ctx.session.building && await ctx.session.flat
    if (!isAuth) {
        ctx.reply('Щось я вас не впізнаю... Пройдіть авторизаію заново, будь ласка', {
            reply_markup: new Keyboard().text('/auth').resized().oneTime()
        })
    }
    return isAuth
}
