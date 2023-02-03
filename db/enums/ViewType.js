const Enum = require("./Enum")
module.exports = class SongType extends Enum {
    static YouTube = new SongType("YouTube", 0)
    static Niconico = new SongType("Niconico", 1)
    static bilibili = new SongType("bilibili", 2)

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