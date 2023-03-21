const Enum = require("./Enum")

module.exports = class FilterOrder extends Enum {
    static Views = new FilterOrder("filter_order_by_views", 0)
    static PublishDate = new FilterOrder("filter_order_by_publish", 1)
    static AdditionDate = new FilterOrder("filter_order_by_addition", 2)
    static Popularity = new FilterOrder("filter_order_by_popularity", 3)

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