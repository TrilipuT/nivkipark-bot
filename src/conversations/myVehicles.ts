import type {MyContext} from "../index";
import {
    backToStart,
    MENU_MY_VEHICLES,
} from "../helpers/menu";
import {blockedLogger} from "../helpers/errors";
import {Composer} from "grammy";
import {isAuthenticated} from "../helpers/auth";

const bot = new Composer<MyContext>();

async function list(ctx: MyContext) {
    try {
        await ctx.session
        const response: object[] = await fetch('https://nivkipark.pages.dev/api/vehicles?phones=' + ctx.session.contact.phone_number + '&type=2', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            }
        }).then(response => response.json())

        let result = ''
        if (response?.length) {
            let replies: string[] = []
            response.forEach((el,index) => {
                let icon = ['🚘','🚖'][index%2]
                replies.push(`${icon} <u>${el.plate}</u> - діє до <code>${el.date_expire.replace('T00:00:00', ' ')}</code>`)
            })
            result = 'Мої авто:\n' + replies.join('\n')
        } else {
            result = 'На ваш номер не зареєстровано жодного авто'
        }

        return result
    } catch (e: any) {
        blockedLogger(e)
    }
}
bot.filter(ctx => ctx.msg?.text == MENU_MY_VEHICLES,
    // Existing requests
    async (ctx, next) => {
        if (await isAuthenticated(ctx)) {
            await backToStart(ctx, await list(ctx))
        }
    })

export default bot