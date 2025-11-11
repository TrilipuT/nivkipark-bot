import {MyContext} from "../index";

function getApiBase(ctx: MyContext): String {
    return ctx.config?.env == 'development' ? 'http://localhost:3000' : 'https://nivkipark.org'
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

export async function getUsers(ctx: MyContext, data: {}) {
    const string = new URLSearchParams(data).toString()
    const response: [object] = await fetch(`${getApiBase(ctx)}/api/users?${string}`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        },
    }).then(response => response.json())
    return response
}

export async function addUser(ctx: MyContext, data: {}) {
    return await fetch(`${getApiBase(ctx)}/api/users`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    })
}

export async function getRequests(ctx: MyContext, data: {}) {
    const string = new URLSearchParams(data).toString()
    const response: [object] = await fetch(`${getApiBase(ctx)}/api/requests?${string}`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
        }
    }).then(response => response.json())
    return response
}

export async function addRequest(ctx: MyContext, data: {}) {
    return await fetch(`${getApiBase(ctx)}/api/requests`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    })
}

export async function deleteRequest(ctx: MyContext, id: Number) {
    return await fetch(`${getApiBase(ctx)}/api/requests`, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({id: id}),
    })
}
