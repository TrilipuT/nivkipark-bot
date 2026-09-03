import {Composer, Keyboard} from "grammy";
import {MyContext} from "../index";
import {backToStart} from "./menu";
import {getUsers} from "./api";

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
    '380974816771', // 8/10 Ірина
    '380662617094', // 10 Павло
    '380984010341', // 10 Катя
]

const concierges = [
    '380501021269',// 6 буд
    '380501021336',
    '380501021339',
// '380632521709', // 4 me
    '380501021354',// 2
    '380501021406',
    //'380503279930', // головний пост
    '380503936761',// 1
    '380503936762',
    '380503936763',
    '380503936764',// 3
    '380503936766',
    '380503936768',
    '380503936769',// 4
    '380503936771',
    '380503936772',
    // '380661294132',// 8
    // '380661294134',
    // '380661294135',
    '380751233691',// 7
    '380751233692',
    '380751233693',
    '380754531710',// 10
    '380754531711',
    '380754531712',
    '380754531713',

    '380669094075', // 11 буд, 1 секція. особистий номер
    '380979337888', // 11 буд, 2 секція. особистий номер
    '380976499093', // 9 буд, 1 секція. особистий номер
    // '380952943669',// 5
    // '380952943670',
    // '380952943671',
]

const bot = new Composer<MyContext>();

export async function isAdmin(ctx: MyContext) {
    await ctx.session
    return ctx.session.contact.phone_number && admins.includes(ctx.session.contact.phone_number)
}

export function isConcierge(phone_number: string) {
    return concierges.includes(phone_number)
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
    if (isConcierge(ctx.session.contact.phone_number)) {
        // all good - allow for Concierges
    } else if (await isBlocked(ctx)) {
        allow = false
        await backToStart(ctx, '❗️Користування ботом обмежено.❗️\nПеревірте наявність заборгованості перед ОСББ.\nПісля сплати заборгованності надішліть квитанцію про оплату @dm_domolad або @domoladbot і доступ буде відновлено якнайшвидше. ')
    } else if ((ctx.session.status ?? 'ACTIVE') === 'NOT_FOUND') {
        allow = false
        await backToStart(ctx, '🤷‍♂️ Ваш номер не знайдено в базі мешканців.\n\nЗвяжіться з ОСББ вашого будинку щоб внести номер в базу.')
    }
    return allow
}

export async function isBlocked(ctx: MyContext) {
    await ctx.session
    if (!ctx.session.status_upd_time || (ctx.session.status_upd_time + (5 * 60 * 1000)) < Date.now()) {
        let users = await getUsers(ctx, {phone: ctx.session.contact.phone_number})
        if (users.length) {
            ctx.session.status = users[0].status
        } else {
            if (await isUserInChat(ctx, ctx.session.contact)) {
                ctx.session.status = 'ACTIVE'
            } else {
                // not found user - blocked
                ctx.session.status = 'NOT_FOUND'
            }
        }
        ctx.session.status_upd_time = Date.now()
    }
    console.log(ctx.session.status)
    return ["BLOCKED", "DISABLED"].includes(ctx.session.status)
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
