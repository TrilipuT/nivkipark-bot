import {Conversation} from "@ponomarevlad/grammyjs-conversations";

export async function blockedCleanup(e, ctx, conversation:boolean|Conversation<any> = false) {
    console.log(e);
    if (e.error_code == 403 && e.description == 'Forbidden: bot was blocked by the user') {
        const handler = conversation ? conversation : ctx
        await handler.session
        handler.session.contact = ''
        handler.session.building = ''
        handler.session.flat = ''
        handler.session.blocked = 'true'
        handler.session.conversation = ''
        console.log('flushed')
    }
}