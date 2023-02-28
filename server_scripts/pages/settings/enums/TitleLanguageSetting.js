const Enum = require("../../../../db/enums/Enum")

module.exports = class TitleLanguageSetting extends Enum {
    static Native = new TitleLanguageSetting("Native", 0)
    static Romaji = new TitleLanguageSetting("Romaji", 1)
    static English = new TitleLanguageSetting("English", 2)

    static {
        const enums = Object.values(this)

        const values = []
        const map = {}

        // build the values and map tables/objects
        enums.forEach(value => {
            values[value.id] = value
            map[value.name] = value
        })

        // add to object
        this.values = values
        this.map = map
    }
}