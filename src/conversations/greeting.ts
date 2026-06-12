import {Conversation, createConversation} from "@ponomarevlad/grammyjs-conversations";
import type {MyContext} from "../index";
import {Composer, Keyboard} from "grammy";
import {backToStart} from "../helpers/menu";
// @ts-ignore
import {handleException} from "../helpers/errors";
import {addUser} from "../helpers/api";
import {askBuilding, askFlat} from "../helpers/questions";
import {isConcierge, isUserInChat, isUserInDB} from "../helpers/auth";

const bot = new Composer<MyContext>();

export async function greeting(conversation: Conversation<any>, ctx: MyContext) {
    try {
        // ========= Ask for contact =========
        await ctx.reply(`Вітаю!\nДавайте знайомитись. Поділіться вашим номером телефона.\nНатисніть кнопку "Поділитись контактом" знизу 👇`, {
            reply_markup: new Keyboard().requestContact('Поділитись контактом').oneTime().resized()
        });

        const contactReply = await conversation.waitFor(':contact', {
            otherwise: async (ctx) => {
                await ctx.reply(`Не зрозумів нічого... \nНатисніть кнопку "Поділитись контактом" знизу 👇`)
            }
        });
        // ========= Check for contact =========
        let isAllowed = false;
        if (contactReply.msg?.contact) {
            // set contact into format without + and -
            contactReply.msg.contact.phone_number = contactReply.msg.contact.phone_number.replace('+', '').replace('-', '')

            const statusMessage = await ctx.reply("Звіряємо дані...");
            isAllowed = await conversation.external(async () => await isUserInDB(ctx, contactReply.msg.contact))
            if (!isAllowed) {
                isAllowed = await isUserInChat(ctx, contactReply.msg.contact)
                if (!isAllowed) {
                    isAllowed = isConcierge(contactReply.msg.contact.phone_number)
                }
            }

            try {
                await conversation.sleep(1000)
                await statusMessage.editText("Зроблено.")
                await conversation.sleep(1000)
            } catch (e) {
            }
            // await statusMessage.delete().catch(() => {})
            conversation.session.contact = contactReply.msg.contact;
            if (!isAllowed) {
                await ctx.reply(`Вибачте, ваш номер телефону не верифіковано. Для користування ботом звяжіться з представником ОСББ вашого будинку.\nПісля цього натисніть /start нижче.`, {
                    reply_markup: new Keyboard().text('/start').resized().oneTime()
                })
                return
            }
        }
        // ========= End ask for contact =========
        const building = await askBuilding(
            ctx,
            conversation,
            `Приємно познайомитись, ${contactReply.msg?.contact?.first_name}!\nВкажіть в якому будинку ви мешкаєте:`
        )
        conversation.session.building = building
        // ========= End ask for building =========

        // ========= Ask for flat =========
        const flat = await askFlat(ctx, conversation, `Вкажіть вашу квартиру:`)
        conversation.session.flat = flat
        // ========= End ask for flat =========
        // if (isInChat && !isAllowed) {
        //     await addUser(ctx, {
        //         phone: conversation.session.contact.phone_number,
        //         building: building,
        //         flat: flat
        //     })
        // }
        console.log('auth done')

        await backToStart(ctx, `Супер, дякую за авторизацію. Перейдемо до справи.`)
        return
    } catch (e: any) {
        await handleException(e, ctx)
    }
}

bot.use(createConversation(greeting))

export default bot
