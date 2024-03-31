import {Composer, Keyboard} from "grammy";
import {MyContext} from "../index";
import {backToStart} from "./menu";

const blocked = {
    "b1": [],
    "b2": [],
    "b3": [],
    "b4": [],
    "b5": [],
    "b6": ['2', '20', '24', '33', '41', '60', '63', /*'65',*/ '78', '83', '89', '96', '110', '141', '150', '168', '178', '182', '185', '191', '211', '213'],
    "b7": [],
    "b8": [],
    "b9": [],
    "b10": [],
    "b11": [],
    "b12": [],
}

const bot = new Composer<MyContext>();

export async function isAuthenticated(ctx: MyContext) {
    await ctx.session
    let allow = true
    const isAuth = ctx.session.contact.phone_number && ctx.session.building && ctx.session.flat
    if (!isAuth) {
        allow = false
        await ctx.reply('Щось я вас не впізнаю... Пройдіть авторизацію заново, будь ласка 👇', {
            reply_markup: new Keyboard().text('/auth').resized().oneTime()
        })
    }
    const isBlocked = blocked[ctx.session.building] && blocked[ctx.session.building].includes(ctx.session.flat)
    if (isBlocked) {
        allow = false
        await backToStart(ctx, '❗️Користування ботом обмежено.❗️\nПеревірте наявність заборгованості перед ОСББ/ЖЕК.\nДля детальної інформації зверніться до представника вашої управляючої компанії. ')
    }
    return allow
}

bot.command("auth", async (ctx) => {
    await ctx.conversation.enter("greeting")
})

export default bot