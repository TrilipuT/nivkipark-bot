import type {MyContext} from "../index";
import {
    backToStart,
    MENU_MY_VEHICLES,
} from "../helpers/menu";
import {blockedLogger} from "../helpers/errors";
import {Composer, InlineKeyboard} from "grammy";
import {isAuthenticated} from "../helpers/auth";
import type {InlineKeyboardButton} from "grammy/out/types";
import {getVehicles} from "../helpers/api";

const bot = new Composer<MyContext>();

bot.filter(ctx => ctx.msg?.text == MENU_MY_VEHICLES,
    // Existing requests
    async (ctx, next) => {
        if (await isAuthenticated(ctx)) {
            try {
                await ctx.session
                const response = await getVehicles(ctx, {phones:ctx.session.contact.phone_number,type:2})

                let result = ''
                let buttons: InlineKeyboardButton[][] = []
                if (response?.length) {
                    let replies: string[] = []

                    response.forEach((el, index) => {
                        let icon = ['🚘', '🚖'][index % 2]
                        replies.push(`${icon} <u>${el.plate}</u> - діє до <code>${el.date_expire.replace('T00:00:00', '')}</code>`)
                        buttons.push([InlineKeyboard.text(`Видалити ${icon}${el.plate}`, `delete:${el.plate}`)])
                    })
                    result = 'Мої авто:\n' + replies.join('\n')
                } else {
                    result = 'На ваш номер не зареєстровано жодного авто'
                }

                await ctx.reply(result, {
                    // reply_markup: InlineKeyboard.from(buttons).toFlowed(1),
                    parse_mode: 'HTML'
                })

            } catch (e: any) {
                blockedLogger(e, ctx)
            }

            await backToStart(ctx)
        }
    })

export default bot