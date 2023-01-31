const Enum = require("./Enum")

module.exports = class SongType extends Enum {
    static Vocaloid = new SongType("Vocaloid", 0)
    static CeVIO = new SongType("CeVIO", 1)
    static SynthesizerV = new SongType("SynthesizerV", 2)
    static Other = new SongType("Other", 3)

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