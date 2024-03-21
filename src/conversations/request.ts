import {Conversation, createConversation} from "@ponomarevlad/grammyjs-conversations";
import type {MyContext} from "../index";
import {backToStart, cancelKeyboard, MENU_CANCEL, MENU_REQUESTS_LIST, MENU_REQUESTS_NEW} from "../helpers/menu";
import {blockedLogger} from "../helpers/errors";
import {Composer, InlineKeyboard} from "grammy";
import {isAuthenticated} from "../helpers/auth";
import type {InlineKeyboardButton} from "grammy/out/types";
import {createCallbackData} from "callback-data";
import {addVehicle, deleteVehicle, getVehicles} from "../helpers/api";

const bot = new Composer<MyContext>();
const requestData = createCallbackData('request', {id: Number})

async function newRequest(conversation: Conversation<any>, ctx: MyContext) {
    try {
        await ctx.reply("<b>Введіть номер авто:</b>\n<em>Використовуйте повний формат</em> <code>ХХ0000ХХ</code>", {
            reply_markup: cancelKeyboard,
            parse_mode: 'HTML'
        })
        // @ts-ignore
        const plateReply = await conversation.waitFor('message:text')
        const re = new RegExp('^[a-zA-Zа-яА-Я0-9]*$')
        if (!re.test(plateReply.message.text)) {
            if (plateReply.message.text != MENU_CANCEL) {
                await ctx.reply("Помилка в номері.\n<em>Без пробілів і спецзнаків. Тільки букви і цифри.</em>", {parse_mode: 'HTML'})
            }
            await conversation.skip()
        }

        const plate = plateReply.message.text.toUpperCase()
        const now = await conversation.now()
        const date_added = new Date(now)
        const date_expire = new Date(now)
        date_expire.setDate(date_expire.getDate() + 1)
        await conversation.session

        let data = {
            'plate': plate,
            'building': conversation.session.building,
            'flat': conversation.session.flat,
            'type': 1,
            'phone': conversation.session.contact.phone_number,
            'date_added': date_added.toISOString().slice(0, 19),
            'date_expire': date_expire.toISOString().slice(0, 19),
        }

        const result = await addVehicle(ctx, data)
        let message = `Авто з номером ${plate} додано.\nТермін дії 24 години - до ${date_expire.toLocaleString('uk-UA')}.`
        if (!result.ok) {
            message = 'Вибачте, сталась помилка. Спробуйте надіслати заявку пізніше.'
        }

        await backToStart(ctx, message)
    } catch (e: any) {
        blockedLogger(e,ctx)
    }
}

async function list(ctx: MyContext) {
    try {
        await ctx.session
        const response = await getVehicles(ctx, {
            phone: ctx.session.contact.phone_number,
            type: 1
        })

        let result = ''
        let buttons: InlineKeyboardButton[][] = []

        if (response?.length) {
            let replies: string[] = []
            response.forEach((el, index) => {
                let icon = ['🚘', '🚖'][index % 2]
                replies.push(`${icon} <u>${el.plate}</u> - діє до <code>${el.date_expire.replace('T', ' ')}</code>`)
                buttons.push([InlineKeyboard.text(`Видалити ${icon}${el.plate}`, requestData.pack({id: el.id}))])
            })
            result = 'Активні заявки:\n' + replies.join('\n')
        } else {
            result = 'Нічого не знайдено'
        }

        await ctx.reply(result, {
            reply_markup: InlineKeyboard.from(buttons).toFlowed(1),
            parse_mode: 'HTML'
        })

    } catch (e: any) {
        blockedLogger(e,ctx)
    }
}

bot.use(createConversation(newRequest));

// const authed = bot.filter(async ctx => await isAuthenticated(ctx))
bot.callbackQuery(
    requestData.filter(),
    async (ctx) => {
        const data = requestData.unpack(ctx.callbackQuery.data)
        const result = await deleteVehicle(ctx, data.id)
        if (result.ok) {
            ctx.answerCallbackQuery()
            await ctx.reply('Видалено!')
            await list(ctx)
        } else {
            backToStart(ctx, 'От лажа, щось пішло не так...')
        }
    }
)
bot.filter(ctx => ctx.msg?.text == MENU_REQUESTS_NEW,
    // New request
    async (ctx, next) => {
        if (await isAuthenticated(ctx)) {
            await ctx.conversation.enter("newRequest")
        }
    })
bot.filter(ctx => ctx.msg?.text == MENU_REQUESTS_LIST,
    // Existing requests
    async (ctx, next) => {
        if (await isAuthenticated(ctx)) {
            await list(ctx)
            await backToStart(ctx)
        }
    })

export default bot