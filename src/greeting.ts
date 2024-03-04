import type {Conversation} from "@ponomarevlad/grammyjs-conversations";
import type {MyContext} from "./index";
import {InlineKeyboard, Keyboard} from "grammy";
import {backToStart} from "./menu";
import {getBuildingName} from 'nivkipark/src/helpers/buildings'

export async function greeting(conversation: Conversation<any>, ctx: MyContext) {
    await ctx.reply(`Вітаю!\nДавайте знайомитись. Поділіться вашим номером телефона`, {
        reply_markup: new Keyboard().requestContact('Поділитись контактом').oneTime().resized()
    });
    // @ts-ignore
    const contactReply = await conversation.wait(':contact');
    if (!contactReply.message?.contact) {
        conversation.log(contactReply)
        await ctx.reply(`Не зрозумів нічого... \nНатисніть кнопку "Поділитись контактом" знизу 👇`)
        await conversation.skip()
    }
    conversation.session.contact = contactReply.message?.contact;

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
    await ctx.reply(`Приємно познайомитись, ${contactReply.message?.contact?.first_name}!\nВкажіть в якому будинку ви мешкаєте:`, {
        reply_markup: keyboard
    });
    const buildingReply = await conversation.waitFor("callback_query:data");
    if (!buildingReply.update.callback_query.data) {
        conversation.log(buildingReply)
        await ctx.reply(`Не зрозумів нічого... \nОберіть один з варіантів будь ласка`)
        await conversation.skip()
    }
    conversation.session.building = buildingReply.update.callback_query.data

    await ctx.reply(`Вкажіть вашу квартиру:`, {
        reply_markup: {remove_keyboard: true},
    })
    const flatReply = await conversation.wait();
    conversation.session.flat = flatReply.message.text

    await backToStart(ctx, `Супер, дякую за авторизацію. Перейдем до діла.`)
    return
}