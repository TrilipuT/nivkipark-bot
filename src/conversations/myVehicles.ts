import type {MyContext} from "../index";
import {
    backToStart,
    MENU_MY_VEHICLES,
} from "../helpers/menu";
import {handleException} from "../helpers/errors";
import {Composer, InlineKeyboard} from "grammy";
import {isAuthenticated} from "../helpers/auth";
import type {InlineKeyboardButton} from "grammy/out/types";
import {getVehicles} from "../helpers/api";
import {LocalDate} from "../helpers/date";

const bot = new Composer<MyContext>();

bot.filter(ctx => ctx.msg?.text == MENU_MY_VEHICLES,
    // Existing requests
    async (ctx, next) => {
        if (await isAuthenticated(ctx)) {
            try {
                await ctx.session
                const response = await getVehicles(ctx, {phones: ctx.session.contact.phone_number})
                let result = ''
                let buttons: InlineKeyboardButton[][] = []
                if (response?.count) {
                    let replies: string[] = []
                    response.data.forEach((el, index) => {
                        let date_expire = LocalDate.parse(el.expire_at)
                        let icon = ['🚘', '🚖'][index % 2]
                        replies.push(`${icon} <u>${el.plate}</u> - діє до <code>${date_expire.toLocaleDateString()}</code>`)
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

                console.log('my vehicles')

                await backToStart(ctx)
            } catch (e: any) {
                await handleException(e, ctx)
            }
        }
    })

export default bot
