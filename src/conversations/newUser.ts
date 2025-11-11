import {Conversation, createConversation} from "@ponomarevlad/grammyjs-conversations";
import type {MyContext} from "../index";
import {
    backToStart,
    cancelKeyboard,
    MENU_ADD_USER,
    MENU_CANCEL,
} from "../helpers/menu";
import {handleException} from "../helpers/errors";
import {Composer} from "grammy";
import {isAdmin} from "../helpers/auth";
import {addUser, getUsers} from "../helpers/api";
import {askBuilding, askFlat} from "../helpers/questions";
import {sanitizePhone} from "nivkipark/src/helpers/sanitize"

const bot = new Composer<MyContext>();

async function newUser(conversation: Conversation<any>, ctx: MyContext) {
    try {
        // ========= Ask for phone =========
        let data = {};
        await ctx.reply("<b>Введіть номер телефону нового користувача:</b>\n<em>Використовуйте повний формат</em> <code>380ХХХХХХХХХ</code>", {
            reply_markup: cancelKeyboard,
            parse_mode: 'HTML'
        })

        // @ts-ignore
        const phoneReply = await conversation.waitFor('message:text')
        const phone = sanitizePhone(phoneReply.message.text)

        const re = new RegExp('^\\+?380\\d{9}$')
        if (!re.test(phone)) {
            if (phoneReply.message.text != MENU_CANCEL) {
                await ctx.reply("Помилка в номері.\n<em>Без пробілів і спецзнаків.</em>\n<em>Використовуйте повний формат</em> <code>380ХХХХХХХХХ</code>", {parse_mode: 'HTML'})
            }
            await conversation.skip()
        }

        data.phone = phone
        const users = await getUsers(ctx, data)
        await conversation.sleep(1000)
        if (users.length) {
            await backToStart(ctx, 'Користувач з таким номером телефону вже існує.')
            return
        }

        // ========= Ask for building =========
        data.building = await askBuilding(
            ctx,
            conversation,
            `Вкажіть будинок:`
        )
        // ========= Ask for flat =========
        data.flat = await askFlat(ctx, conversation, `Вкажіть квартиру:`)
        // ========= End ask for flat =========

        const result = await addUser(ctx, data)
        let message = `Користувач з номером ${data.phone} додано.`
        if (!result.ok) {
            message = 'Вибачте, сталась помилка. Спробуйте надіслати заявку пізніше.'
        }

        console.log('user added')

        await backToStart(ctx, message)
    } catch (e: any) {
        await handleException(e, ctx)
    }
}

bot.use(createConversation(newUser));

bot.filter(ctx => ctx.msg?.text == MENU_ADD_USER,
    // Existing requests
    async (ctx, next) => {
        if (!await isAdmin(ctx)) {
            await backToStart(ctx, "Як ти сюди попав, розбійник?")
        }
        await ctx.conversation.enter("newUser")
    })

export default bot
