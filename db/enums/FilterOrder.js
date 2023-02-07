const Enum = require("./Enum")

module.exports = class FilterOrder extends Enum {
    static Views = new FilterOrder("Views", 0)
    static PublishDate = new FilterOrder("PublishDate", 1)
    static AdditionDate = new FilterOrder("AdditionDate", 2)

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