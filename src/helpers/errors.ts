import {MyContext} from "../index";

export function blockedLogger(e: any, ctx: MyContext) {
    if (e.error_code == 403 && e.description == 'Forbidden: bot was blocked by the user') {
        // that's fine - let him go...
    } else {
        ctx.config.sentry.captureException(e);
    }
}