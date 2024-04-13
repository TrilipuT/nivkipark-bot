export class LocalDate {
    date: Date

    constructor(date: Date) {
        this.date = date
        return this
    }

    static parse(dateString: string) {
        dateString = dateString.includes('Z') ? dateString : dateString + 'Z'
        return new LocalDate(new Date(Date.parse(dateString)))
    }

    toLocaleString() {
        return this.date.toLocaleString('uk-UA', {timeZone: 'Europe/Kyiv'})
    }

    toLocaleDateString(){
        return this.date.toLocaleDateString('uk-UA', {timeZone: 'Europe/Kyiv'})
    }
}
