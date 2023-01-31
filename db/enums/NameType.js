const Enum = require("./Enum")

module.exports = class NameType extends Enum {
    static Original = new NameType("Original", 0)
    static Japanese = new NameType("Japanese", 1)
    static English = new NameType("English", 2)
    static Romaji = new NameType("Romaji", 3)

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