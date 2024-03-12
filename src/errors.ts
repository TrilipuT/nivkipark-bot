export function blockedLogger(e: any) {
    console.log(e);
    if (e.error_code == 403 && e.description == 'Forbidden: bot was blocked by the user') {
        // that's fine - let him go...
    } else {
        throw e
    }
}