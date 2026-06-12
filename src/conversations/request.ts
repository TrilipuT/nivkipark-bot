import {Conversation, createConversation} from "@ponomarevlad/grammyjs-conversations";
import type {MyContext} from "../index";
import {backToStart, cancelKeyboard, MENU_CANCEL, MENU_REQUESTS_LIST, MENU_REQUESTS_NEW} from "../helpers/menu";
import {handleException} from "../helpers/errors";
import {Composer, InlineKeyboard, Keyboard} from "grammy";
import {isAuthenticated, isConcierge} from "../helpers/auth";
import type {InlineKeyboardButton} from "grammy/out/types";
import {createCallbackData} from "callback-data";
import {addRequest, deleteRequest, getRequests} from "../helpers/api";
import {LocalDate} from '../helpers/date'
import {getBuildingName} from "nivkipark/src/helpers/buildings";
import {sanitizePlate} from "../helpers/sanitize";
import {sanitizePhone} from "nivkipark/src/helpers/sanitize";

const bot = new Composer<MyContext>();
const requestData = createCallbackData('request', {id: Number})
const MENU_UNUSUAL_PLATE = 'Номер нестандартний'

async function newRequest(conversation: Conversation<any>, ctx: MyContext) {
    try {
        // PLATE
        await ctx.reply("<b>Введіть номер авто:</b>\n<em>Використовуйте повний формат</em> <code>ХХ0000ХХ</code>", {
            reply_markup: cancelKeyboard,
            parse_mode: 'HTML'
        })

        let plateReply = await conversation.waitForHears([MENU_UNUSUAL_PLATE, /^[А-ЩЬЮЯҐЄІЇA-Z]{2}[0-9]{4}[А-ЩЬЮЯҐЄІЇA-Z]{2}$/i], {
            otherwise: async (ctx) => {
                if (ctx.msg.text != MENU_CANCEL) {
                    let plate = sanitizePlate(ctx.msg.text ?? ctx.msg.caption)
                    await ctx.reply(`Помилка в номері - <code>${plate}</code>\n<em>Без пробілів і спецзнаків. Тільки букви і цифри.\nФормат - саме <code>ХХ0000ХХ</code></em>\n\nХочете ввести нестандартний номер?`, {
                        reply_markup: new Keyboard().text(MENU_UNUSUAL_PLATE).text(MENU_CANCEL),
                        parse_mode: 'HTML'
                    })
                }
            },
        })

        // UNUSUAL PLATE
        if (plateReply.msg.text == MENU_UNUSUAL_PLATE) {
            await ctx.reply("Добре, введіть нестандартний номер ще раз:", {
                reply_markup: cancelKeyboard,
            })
            plateReply = await conversation.waitFor('message:text')
        }

        // IF CONCIERGE ASK FOR PHONE AND FLAT
        let flat = null
        let phone = null
        if (isConcierge(ctx.session.contact.phone_number)) {

            await ctx.reply("<b>Введіть КВАРТИРУ / ПРИМІЩЕННЯ, куди подається заявка:</b>", {
                reply_markup: cancelKeyboard,
                parse_mode: 'HTML'
            })
            const flatReply = await conversation.waitFor('message:text')
            flat = flatReply.msg.text

            await ctx.reply("<b>Введіть НОМЕР телефону ХТО ЗРОБИВ ЗАЯВКУ:</b>\n<em>Використовуйте повний формат</em> <code>380ХХХХХХХХХ</code>", {
                reply_markup: cancelKeyboard,
                parse_mode: 'HTML'
            })
            const phoneReply = await conversation.waitForHears(/^\+?380\d{9}$/i,{
                otherwise: async (ctx)=>{
                    await ctx.reply("Помилка в номері.\n<em>Без пробілів і спецзнаків.</em>\n<em>Використовуйте повний формат</em> <code>380ХХХХХХХХХ</code>", {
                        reply_markup: cancelKeyboard,
                        parse_mode: 'HTML'
                    })
                }
            })
            phone = sanitizePhone(phoneReply.msg.text)
        }

        await ctx.reply("Відправляємо дані...");

        const plate = sanitizePlate(plateReply.msg.text ?? plateReply.msg.caption)
        const now = await conversation.now()
        const date_expire = new Date(now)
        date_expire.setDate(date_expire.getDate() + 1)
        await conversation.session

        let data = {
            'plate': plate,
            'address': getBuildingName(conversation.session.building) + ', ' + conversation.session.flat,
            'phone': conversation.session.contact.phone_number,
            'expire_at': date_expire.toISOString(),
        }
            // If concierge - override some params
        if (isConcierge(ctx.session.contact.phone_number)) {
            data.address = getBuildingName(conversation.session.building) + ', ' + flat
            data.phone = phone
            data.data = {'created_by_phone': conversation.session.contact.phone_number}
        }

        const result = await addRequest(ctx, data)
        await conversation.sleep(1000)
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
