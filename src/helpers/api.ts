import {MyContext} from "../index";

function getApiBase(ctx: MyContext): String {
    return ctx.config?.env == 'development' ? 'http://localhost:8788' : 'https://nivkipark.pages.dev'
}

export async function addVehicle(ctx: MyContext, data: {}) {
    return await fetch(`${getApiBase(ctx)}/api/vehicles`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    })
}

export async function getVehicles(ctx: MyContext, data: {}) {
    const string = new URLSearchParams(data).toString()
    const response: [object] = await fetch(`${getApiBase(ctx)}/api/vehicles?${string}`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        }
    }).then(response => response.json())
    return response
}

export async function deleteVehicle(ctx: MyContext, id: Number) {
    return await fetch(`${getApiBase(ctx)}/api/vehicles?id=${id}`, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
        }
    })
}