import {Keyboard} from "grammy";
import {isAdmin, isConcierge} from "./auth";
import {MyContext} from "../index";

export const MENU_REQUESTS_NEW = "🆕 Заявка на вїзд"
export const MENU_REQUESTS_LIST = "🗒 Активні заявки"
export const MENU_MY_VEHICLES = "🚙 Мої авто"
export const MENU_CANCEL = '🚮 Відмінити'
export const MENU_ADD_USER = 'Додати користувача'

export const cancelKeyboard = new Keyboard()
    .text(MENU_CANCEL)
    .resized()

export const wrongPlateKeyboard = new Keyboard()
    .text()
    .text(MENU_CANCEL)
    .resized()

async function getKeyboard(ctx: MyContext) {
    const keyboard = new Keyboard()
        .text(MENU_REQUESTS_NEW)
        .text(MENU_REQUESTS_LIST)

    if (!(await isConcierge(ctx.session.contact.phone_number))) {
        keyboard.text(MENU_MY_VEHICLES)
    }

    if (await isAdmin(ctx)) {
        keyboard
            .row()
            .text(MENU_ADD_USER)
    }
    keyboard.resized().oneTime()
    return keyboard
}

export async function backToStart(ctx: MyContext, text: string = "Що будемо робити?") {
    await ctx.reply(text, {
        reply_markup: await getKeyboard(ctx),
        parse_mode: 'HTML'
    })
}
