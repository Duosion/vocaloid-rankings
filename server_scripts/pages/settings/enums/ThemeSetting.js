const Enum = require("../../../../db/enums/Enum")

module.exports = class ThemeSetting extends Enum {
    static DeviceTheme = new ThemeSetting('Device', 0)
    static Light = new ThemeSetting("Light", 1)
    static Dark = new ThemeSetting("Dark", 2)

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