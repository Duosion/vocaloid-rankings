const Enum = require("./Enum")

module.exports = class AccessLevel extends Enum {
    static Guest = new AccessLevel('Guest', 0)
    static User = new AccessLevel('User', 1)
    static Editor = new AccessLevel('Editor', 2)
    static Admin = new AccessLevel('Admin', 4)

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