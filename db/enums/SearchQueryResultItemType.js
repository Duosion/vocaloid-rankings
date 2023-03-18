const Enum = require("./Enum")

module.exports = class SearchQueryResultItemType extends Enum {
    static Song = new SearchQueryResultItemType("Song", 0)
    static Artist = new SearchQueryResultItemType("Artist", 1)

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