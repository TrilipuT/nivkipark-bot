import {Conversation, createConversation} from "@ponomarevlad/grammyjs-conversations";
import type {MyContext} from "../index";
import {backToStart, cancelKeyboard, MENU_CANCEL, MENU_REQUESTS_LIST, MENU_REQUESTS_NEW} from "../helpers/menu";
import {handleException} from "../helpers/errors";
import {Composer, InlineKeyboard} from "grammy";
import {isAuthenticated} from "../helpers/auth";
import type {InlineKeyboardButton} from "grammy/out/types";
import {createCallbackData} from "callback-data";
import {addRequest, deleteRequest, getRequests} from "../helpers/api";
import {LocalDate} from '../helpers/date'
import {getBuildingName} from "nivkipark/src/helpers/buildings";
import {sanitizePlate} from "../helpers/sanitize";

const bot = new Composer<MyContext>();
const requestData = createCallbackData('request', {id: Number})

async function newRequest(conversation: Conversation<any>, ctx: MyContext) {
    try {
        await ctx.reply("<b>Введіть номер авто:</b>\n<em>Використовуйте повний формат</em> <code>ХХ0000ХХ</code>", {
            reply_markup: cancelKeyboard,
            parse_mode: 'HTML'
        })
        const plateReply = await conversation.waitForHears(/^[А-ЩЬЮЯҐЄІЇA-Z]{2}[0-9]{4}[А-ЩЬЮЯҐЄІЇA-Z]{2}$/i, {
            otherwise: async (ctx) => {
                if (ctx.msg.text != MENU_CANCEL) {
                    await ctx.reply("Помилка в номері.\n<em>Без пробілів і спецзнаків. Тільки букви і цифри. Формат - саме <code>ХХ0000ХХ</code></em>", {parse_mode: 'HTML'})
                }
            }
        })

        const plate = sanitizePlate(plateReply.msg.text ?? plateReply.msg.caption)
        const now = await conversation.now()
        const date_added = new Date(now)
        const date_expire = new Date(now)
        date_expire.setDate(date_expire.getDate() + 1)
        await conversation.session

        let data = {
            'plate': plate,
            'address': getBuildingName(conversation.session.building) + ', ' + conversation.session.flat,
            'phone': conversation.session.contact.phone_number,
            // 'created_at': date_added.toISOString(),
            'expire_at': date_expire.toISOString(),
        }

        const result = await addRequest(ctx, data)
        let message = `Авто з номером ${plate} додано.\nТермін дії 24 години - до ${new LocalDate(date_expire).toLocaleString()}.`
        if (!result.ok) {
            message = 'Вибачте, сталась помилка. Спробуйте надіслати заявку пізніше.'
        }

        console.log('request new done')

        await backToStart(ctx, message)
    } catch (e: any) {
        console.error(e)
        await handleException(e, ctx)
    }
}

async function list(ctx: MyContext) {
    try {
        await ctx.session
        const response = await getRequests(ctx, {
            phone: ctx.session.contact.phone_number,
        })

        let result = ''
        let buttons: InlineKeyboardButton[][] = []
        if (response?.count) {
            let replies: string[] = []
            response?.data?.requests.forEach((el, index) => {
                let date_expire = LocalDate.parse(el.expire_at)
                let icon = ['🚘', '🚖'][index % 2]
                replies.push(`${icon} <u>${el.plate}</u> - діє до <code>${date_expire.toLocaleString()}</code>`)
                buttons.push([InlineKeyboard.text(`Видалити ${icon}${el.plate}`, requestData.pack({id: el.id}))])
            })
            result = 'Активні заявки:\n' + replies.join('\n')
        } else {
            result = 'Нічого не знайдено'
        }

        console.log('request list')

        await ctx.reply(result, {
            reply_markup: InlineKeyboard.from(buttons).toFlowed(1),
            parse_mode: 'HTML'
        })

    } catch (e: any) {
        await handleException(e, ctx)
    }
}

bot.use(createConversation(newRequest));

// const authed = bot.filter(async ctx => await isAuthenticated(ctx))
bot.callbackQuery(
    requestData.filter(),
    async (ctx) => {
        const data = requestData.unpack(ctx.callbackQuery.data)
        const result = await deleteRequest(ctx, data.id)
        if (result.ok) {
            ctx.answerCallbackQuery()
            await ctx.reply('Видалено!')
            console.log('request deleted')
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
