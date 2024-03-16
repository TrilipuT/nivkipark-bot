import {Keyboard} from "grammy";
import {Context} from "grammy/web";

export const MENU_REQUESTS_NEW = "🆕 Заявка на вїзд"
export const MENU_REQUESTS_LIST = "🗒 Активні заявки"
export const MENU_MY_VEHICLES = "🚙 Мої авто"
export const MENU_CANCEL = '🚮 Відмінити'

const defaultActionsKeyboard = new Keyboard()
    .text(MENU_REQUESTS_NEW)
    .text(MENU_REQUESTS_LIST)
    .text(MENU_MY_VEHICLES)
    .resized().oneTime();

export const cancelKeyboard = new Keyboard()
    .text(MENU_CANCEL)
    .resized()

export async function backToStart(ctx: Context, text: string = "Що будемо робити?") {
    await ctx.reply(text, {
        reply_markup: defaultActionsKeyboard,
        parse_mode: 'HTML'
    })
}
