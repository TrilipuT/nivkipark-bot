import {InlineKeyboard} from "grammy";
import {getBuildingName} from "nivkipark/src/helpers/buildings";
import {MyContext} from "../index";
import {Conversation} from "@ponomarevlad/grammyjs-conversations";

export async function askBuilding(ctx: MyContext, conversation: Conversation<any>, question: string) {
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
        .text(getBuildingName('b9'), 'b9').row()
        .text(getBuildingName('b10'), 'b10')
        .text(getBuildingName('b11'), 'b11')
        .text(getBuildingName('b12'), 'b12')

    // ========= Ask for building =========
    await ctx.reply(question, {
        reply_markup: keyboard
    });
    const buildingReply = await conversation.waitFor("callback_query:data", {
        otherwise: async (ctx) => {
            await ctx.reply(`Оберіть один з варіантів натиснувши на копку вище 👆`)
        }
    });
    await buildingReply.answerCallbackQuery({text: 'Дякую!'})
    return buildingReply.update.callback_query.data
}

export async function askFlat(ctx: MyContext, conversation: Conversation<any>, question: string) {
    await ctx.reply(question, {
        reply_markup: {remove_keyboard: true},
    })
    const flatReply = await conversation.waitFor('message:text', {
        otherwise: async (ctx) => {
            await ctx.reply(`Не зрозумів нічого... \nВведіть номер квартири, приміщення чи комерції.`)
        }
    });
    return flatReply.message.text
}

export async function askType(ctx: MyContext, conversation: Conversation<any>, question: string) {
    const keyboard = new InlineKeyboard()
        .text('Власник', 'OWNER')
        .text('Орендар', 'TENANT')

    // ========= Ask for building =========
    await ctx.reply(question, {
        reply_markup: keyboard
    });
    const buildingReply = await conversation.waitFor("callback_query:data", {
        otherwise: async (ctx) => {
            await ctx.reply(`Оберіть один з варіантів натиснувши на копку вище 👆`)
        }
    });
    await buildingReply.answerCallbackQuery({text: 'Дякую!'})
    return buildingReply.update.callback_query.data
}
