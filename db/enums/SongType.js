const Enum = require("./Enum")

module.exports = class SongType extends Enum {
    static Original = new SongType("Original", 0)
    static Remix = new SongType("Remix", 1)
    static Other = new SongType("Other",2)

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