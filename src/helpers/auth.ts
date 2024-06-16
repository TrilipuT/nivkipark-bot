import {Composer, Keyboard} from "grammy";
import {MyContext} from "../index";
import {backToStart} from "./menu";

// updated as of 06 June
const blocked = {
    "b1": ['27', '35', '61', '77', '1/1', '132', '139', '141', '153', '176', '213', '234', '237', '245', '278'],
    "b2": ['4', '5', '36', '39', '45', '49', '74', '86', '92', '2/4', '101', '124', '133', '137', '150'],
    "b3": ['64', '81', '86', '95', '112', '113', '136', '153', '189', '196', '200', '234', '241', '247', '260', '278'],
    "b4": ['2', '21', '41', '42', '52', '63', '80', '1/1', '101', '125', '126', '138', '159', '162', '169', '177', '181', '203', '205', '233', '238', '240'],
    "b5": ['3', '36', '51', '58', '63', '66', '84', '91', '10', '103', '144', '147', '149', '153', '155', '169', '180', '196', '222', '224', '234', '1/1', '3/5'],
    "b6": ['2', '20', '41', '50', '60', '78', '80', '83', '89', '96', '2/1', '107', '110', '119', '137', '141', '150', '168', '175', '178', '182', '185', '211', '213', '217', '238'],
    "b7": [],
    "b8": [],
    "b9": [],
    "b10": [],
    "b11": [],
    "b12": [],
}

const admins = [
    '380966964221', // 1 Таня
    '380639111075', // 1 Паша
    '380986440039', // 1 Альона
    '380503304033', // 1 🅨🅔🅥
    '380953962888', // 2 Таня
    '380939543331', // 3 Настя
    '380963720485', // 3 Юля
    '380638645550', // 3 Діма
    '380632521709', // 4 me
    '380503860369', // 4 Іра
    '380675572500', // 5 Наталя
    '380957447405', // 6 катя
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

bot.command("auth", async (ctx) => {
    await ctx.conversation.enter("greeting")
})

export default bot