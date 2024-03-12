import {Conversation} from "@ponomarevlad/grammyjs-conversations";
import type {MyContext} from "./index";
import {backToStart, cancelKeyboard, MENU_CANCEL} from "./menu";
import {blockedLogger} from "./errors";

export async function newRequest(conversation: Conversation<any>, ctx: MyContext) {
    try {
        await ctx.reply(`Введіть номер авто (латинськими літерами)`, {
            reply_markup: cancelKeyboard
        })
        // @ts-ignore
        const plateReply = await conversation.wait('message:text')
        const re = new RegExp('^[a-zA-Zа-яА-Я0-9]*$')
        if (!re.test(plateReply.message.text)) {
            if (plateReply.message.text != MENU_CANCEL) {
                await ctx.reply(`Помилка в номері.\nбез пробілів і спецзнаків. тільки букви і цифри.`)
            }
            await conversation.skip()
        }

        let loading = await ctx.reply('Секундочку...')
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

        const result = await fetch('https://nivkipark.pages.dev/api/vehicles', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        })
        let message = `Авто з номером ${plate} додано.\nТермін дії 24 години - до ${date_expire.toLocaleString('uk-UA')}.`
        if (!result.ok) {
            message = 'Вибачте, сталась помилка. Спробуйте надіслати заявку пізніше.'
        }

        await backToStart(ctx, message)
    } catch (e: any) {
        blockedLogger(e)
    }
}

export async function list(ctx: MyContext) {
    try {
        await ctx.session
        const response: object[] = await fetch('https://nivkipark.pages.dev/api/vehicles?phone=' + ctx.session.contact.phone_number + '&type=1', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            }
        }).then(response => response.json())

        let result = ''
        if (response?.length) {
            let replies: string[] = []
            response.forEach((el: object) => {
                replies.push(`<u>${el.plate}</u> - діє до <code>${el.date_expire}</code>`)
            })
            result = 'Активні заявки:\n' + replies.join('\n')
        } else {
            result = 'Нічого не знайдено'
        }

        return result
    } catch (e: any) {
        blockedLogger(e)
    }
}