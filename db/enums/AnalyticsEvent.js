const Enum = require("./Enum")

module.exports = class AnalyticsEvent extends Enum {
    static PageVisit = new AnalyticsEvent('PageVisit', 0)
    static OutgoingUrl = new AnalyticsEvent('OutgoingUrl', 1)
    static FilterAdd = new AnalyticsEvent('FilterAdd', 2)
    static FilterSet = new AnalyticsEvent('FilterSet', 3)
    static Search = new AnalyticsEvent('Search', 4)
    static SettingChange = new AnalyticsEvent('SettingChange', 5)

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