const Enum = require("./Enum")

module.exports = class ArtistRows extends Enum {
    
    static Type = new ArtistRows("type", 0)
    static Category = new ArtistRows("category", 1)
    static PublishDate = new ArtistRows("publishDate", 2)
    static AdditionDate = new ArtistRows("additionDate", 3)
    static Names = new ArtistRows("names", 4)
    static AverageColor = new ArtistRows("averageColor", 5)
    static DarkColor = new ArtistRows("darkColor", 6)
    static LightColor = new ArtistRows("lightColor", 7)
    static Thumbnails = new ArtistRows("thumbnails", 8)
    static BaseArtist = new ArtistRows("BaseArtist", 9)
    static Views = new ArtistRows("views", 10)
    static Placement = new ArtistRows("placement", 11)

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