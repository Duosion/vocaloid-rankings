const Enum = require("../../../../db/enums/Enum")

module.exports = class LanguageSetting extends Enum {
    static Default = new LanguageSetting('Device', 0)
    static English = new LanguageSetting("English", 1)
    static Japanese = new LanguageSetting("Japanese", 2)

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