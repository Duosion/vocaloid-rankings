const Enum = require("./Enum")

module.exports = class ArtistCategory extends Enum {
    static Singer = new ArtistType("Singer", 0)
    static Producer = new ArtistType("Producer", 1)

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