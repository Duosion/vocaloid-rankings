const Enum = require("./Enum")

module.exports = class SongType extends Enum {
    static Original = new SongType("filter_song_type_original", 0)
    static Remix = new SongType("filter_song_type_remix", 1)
    static Other = new SongType("filter_song_type_other",2)

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