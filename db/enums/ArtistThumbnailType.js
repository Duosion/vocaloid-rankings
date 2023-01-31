const Enum = require("./Enum")

module.exports = class ArtistThumbnailType extends Enum {
    static Original = new ArtistThumbnailType("Original", 0)
    static Medium = new ArtistThumbnailType("Medium", 1)
    static Small = new ArtistThumbnailType("Small", 2)
    static Tiny = new ArtistThumbnailType("Tiny", 3)

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