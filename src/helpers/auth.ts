import {Composer, Keyboard} from "grammy";
import {MyContext} from "../index";
import {backToStart} from "./menu";
import {getUsers} from "./api";

// updated as of 06 June
const blocked = {
    "b1": [],
    "b2": [],
    "b3": [],
    "b4": [],
    "b5": [],
    "b6": [],
    "b7": [],
    "b8": [],
    "b9": [],
    "b10": [],
    "b11": [],
    "b12": [],
}

// Owners chat id
const chatId = -1001438308653;

const admins = [
    '380966964221', // 1 Таня
    '380639111075', // 1 Паша
    '380503304033', // 1 🅨🅔🅥
    '380953962888', // 2 Таня
    '380939543331', // 3 Настя
    '380963720485', // 3 Юля
    '380638645550', // 3 Діма
    '380632521709', // 4 me
    '380503860369', // 4 Іра
    '380675572500', // 5 Наталя
    '380964254933', // 5 Юрій
    '380957447405', // 6 Катя
    '380935965858', // 7 Ярослав
    '380672207842', // 8 Сергій
]

const bot = new Composer<MyContext>();

export async function isAdmin(ctx: MyContext) {
    await ctx.session
    return ctx.session.contact.phone_number && admins.includes(ctx.session.contact.phone_number)
}

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
        await backToStart(ctx, '❗️Користування ботом обмежено.❗️\nПеревірте наявність заборгованості перед ОСББ/ЖЕК.\nПісля сплати заборгованності надішліть квитанцію про оплату @dm_domolad або @domoladbot і доступ буде відновлено якнайшвидше. ')
    }
    return allow
}

/**
 * Check user in DB
 * @param ctx
 * @param contact
 */
export async function isUserInDB(ctx: MyContext, contact: InlineQueryResultContact) {
    const users = await getUsers(ctx, {phone: contact.phone_number})
    return !!users.length
}

/** Check user from Chat
 *
 * @param ctx
 * @param contact
 */
export async function isUserInChat(ctx: MyContext, contact: InlineQueryResultContact) {
    const result = await ctx.api.getChatMember(chatId, contact.user_id);
    return ["creator", "administrator", "member", "restricted"].includes(result.status);
}

bot.command("auth", async (ctx) => {
    await ctx.conversation.enter("greeting")
})

export default bot
