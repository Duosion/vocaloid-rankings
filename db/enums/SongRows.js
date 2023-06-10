const Enum = require("./Enum")

module.exports = class SongRows extends Enum {
    static PublishDate = new SongRows("publishDate", 0)
    static AdditionDate = new SongRows("additionDate", 1)
    static Type = new SongRows("type", 2)
    static Thumbnail = new SongRows("thumbnail", 3)
    static MaxresThumbnail = new SongRows("maxresThumbnail", 4)
    static AverageColor = new SongRows("averageColor", 5)
    static DarkColor = new SongRows("darkColor", 6)
    static LightColor = new SongRows("lightColor", 7)
    static Artists = new SongRows("artists", 8)
    static Names = new SongRows("names", 9)
    static VideoIds = new SongRows("videoIds", 10)
    static Views = new SongRows("views", 11)
    static Placement = new SongRows("placement", 12)
    static ThumbnailType = new SongRows("thumbnailType", 13)
    static DisplayThumbnail = new SongRows("displayThumbnail", 14)
    static MaxresDisplayThumbnail = new SongRows("maxresDisplayThumbnail", 15)

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