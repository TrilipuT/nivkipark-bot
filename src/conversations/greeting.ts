import {Conversation, createConversation} from "@ponomarevlad/grammyjs-conversations";
import type {MyContext} from "../index";
import {Composer, InlineKeyboard, Keyboard} from "grammy";
import {backToStart} from "../helpers/menu";
// @ts-ignore
import {getBuildingName} from 'nivkipark/src/helpers/buildings'
import {blockedLogger} from "../helpers/errors";
import {getVehicles} from "../helpers/api";

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
        if (contactReply.message?.contact) {
            // set contact into format without + and -
            contactReply.message.contact.phone_number = contactReply.message?.contact.phone_number.replace('+', '').replace('-', '')

            const statusMessage = await ctx.reply("Звіряємо дані...");
            const response = await conversation.external(async () => await getVehicles(ctx, {
                phones: contactReply.message.contact.phone_number,
                type: 2
            }))

            try {
                await conversation.sleep(1000)
                await statusMessage.editText("Зроблено.")
                await conversation.sleep(1000)
            } catch (e) {

            }
            // await statusMessage.delete().catch(() => {})
            conversation.session.contact = contactReply.message.contact;

            if (!response?.length) {
                await ctx.reply(`Вибачте, ваш номер телефону не верифіковано. Для користування ботом звяжіться з представником ОСББ вашого будинку.\nПісля цього натисніть /start нижче.`, {
                    reply_markup: new Keyboard().text('/start').resized().oneTime()
                })
                return
            }
        }
        // ========= End ask for contact =========


        const keyboard = new InlineKeyboard()
            .text(getBuildingName('b1'), 'b1')
            .text(getBuildingName('b2'), 'b2')
            .text(getBuildingName('b3'), 'b3').row()
            .text(getBuildingName('b4'), 'b4')
            .text(getBuildingName('b5'), 'b5')
            .text(getBuildingName('b6'), 'b6').row()
            // школа 65Г
            .text(getBuildingName('b7'), 'b7')
            .text(getBuildingName('b8'), 'b8')
            // .text('1A (9)','b9')
            // .text('1Б (10)','b10')
            .text(getBuildingName('b11'), 'b11').row()
            .text(getBuildingName('b12'), 'b12')

        // ========= Ask for building =========
        await ctx.reply(`Приємно познайомитись, ${contactReply.message?.contact?.first_name}!\nВкажіть в якому будинку ви мешкаєте:`, {
            reply_markup: keyboard
        });
        const buildingReply = await conversation.waitFor("callback_query:data", {
            otherwise: async (ctx) => {
                await ctx.reply(`Оберіть один з варіантів натиснувши на копку вище 👆`)
            }
        });
        await buildingReply.answerCallbackQuery({text: 'Дякую!'})
        if (buildingReply.update.callback_query.data) {
            conversation.session.building = buildingReply.update.callback_query.data
        }

        // ========= End ask for building =========

        // ========= Ask for flat =========
        await ctx.reply(`Вкажіть вашу квартиру:`, {
            reply_markup: {remove_keyboard: true},
        })
        const flatReply = await conversation.waitFor('message:text', {
            otherwise: async (ctx) => {
                await ctx.reply(`Не зрозумів нічого... \nВведіть номер квартири, приміщення чи назву комерції.`)
            }
        });
        conversation.session.flat = flatReply.message.text
        // ========= End ask for flat =========

        await backToStart(ctx, `Супер, дякую за авторизацію. Перейдемо до справи.`)
        return
    } catch (e: any) {
        blockedLogger(e)
    }
}

bot.use(createConversation(greeting))

export default bot