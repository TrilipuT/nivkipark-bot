export function sanitizePlate(plate) {
    let matches = {
        // Ukr: En
        'У': 'Y',
        'К': 'K',
        'Е': 'E',
        'Н': 'H',
        'Х': 'X',
        'В': 'B',
        'А': 'A',
        'Р': 'P',
        'О': 'O',
        'С': 'C',
        'М': 'M',
        'Т': 'T',
        'І': 'I',
    }
    let matches_ukr = {
        'И': 'I',
        'Є': 'E',
        'Д': 'D',
        'З': 'Z',
        'Б': 'B',
        'Л': 'L'
    };
    if (isValidUkrPlate(plate)) {
        matches = {...matches, ...matches_ukr};
    }
    for (const uk in matches) {
        plate = plate.replaceAll(uk, matches[uk]);
    }
    return plate.toUpperCase()
}

export function sanitizePhone(phone) {
    return phone?.length ? phone.replace(/[\(\)\+\s\D-]/gi, '') : phone;
}

export function sanitizePhones(phones) {
    for (let k in phones) {
        phones[k] = sanitizePhone(phones[k]);
    }
    return phones;
}

export function isValidPlate(plate) {
    return /^[A-Z]{2}[0-9]{4}[A-Z]{2}$/.test(plate.toUpperCase())
}

export function isValidUkrPlate(plate) {
    return /^[А-ЩЬЮЯҐЄІЇA-Z]{2}[0-9]{4}[А-ЩЬЮЯҐЄІЇA-Z]{2}$/.test(plate.toUpperCase())
}
