const Enum = require("./Enum")

module.exports = class PlacementChange extends Enum {
    static UP = new PlacementChange("UP", 0)
    static SAME = new PlacementChange("SAME", 1)
    static DOWN = new PlacementChange("DOWN", 2)

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