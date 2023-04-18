const Enum = require("../../../../db/enums/Enum")

module.exports = class AnalyticsToggleSetting extends Enum {
    static Enabled = new AnalyticsToggleSetting('settings_animations_enabled', 0)
    static Disabled = new AnalyticsToggleSetting("settings_animations_disabled", 1)

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