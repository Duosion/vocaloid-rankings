const Enum = require("./Enum")

module.exports = class FilterDirection extends Enum {
    static Descending = new FilterDirection("filter_direction_descending", 0)
    static Ascending = new FilterDirection("filter_direction_ascending", 1)

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