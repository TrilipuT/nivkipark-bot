import {Composer, Keyboard} from "grammy";
import {MyContext} from "../index";
import {backToStart} from "./menu";

// updated as of 02 May
const blocked = {
    "b1": ['153', '213', '77', '132', '237', '176', '141', '35', '27', '220'],
    "b2": ['92', '52', '137', '101', '5', '28', '36', '150', '39'],
    "b3": ['192', '167', '50', '20', '200', '136', '281', '112', '234', '81', '241', '260', '113', '196'],
    "b4": ['177', '138', '21', '80', '2', '100', '159', '4', '233', '101', '95', '94', '42', '52', '238', '205', '181', '22', '19', '61', '126'],
    "b5": ['147', '91', '180', '66', '224', '159', '10', '58', '153', '169', '103', '63', '3', '51', '155', '267', '144', '234', '20', '22', '222', '190'],
    "b6": ['211', '89', '168', '78', '141', '33', '185', '150', '191', '182', '96', '20', '2', '60', '83', '41', '213', '178', '50', '45', '135', '119', '217', '175', '8', '162', '110'],
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
        await backToStart(ctx, '❗️Користування ботом обмежено.❗️\nПеревірте наявність заборгованості перед ОСББ/ЖЕК.\nПісля сплати заборгованності надішліть квитанцію про оплату @dm_domolad або @domoladbot і доступ буде відновлено якнайшвидше. ')
    }
    return allow
}

bot.command("auth", async (ctx) => {
    await ctx.conversation.enter("greeting")
})

export default bot