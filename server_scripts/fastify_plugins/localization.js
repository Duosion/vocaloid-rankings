const fp = require("fastify-plugin")
const LanguageSetting = require("../pages/settings/enums/LanguageSetting")

const localizations = [
    {
        isoCode: "",
        localization: require("../../localization/template.json")
    },
    {
        isoCode: "en",
        localization: require("../../localization/en.json")
    },
    {
        isoCode: "ja",
        localization: require("../../localization/jp.json")
    }
    
]

const plugin = (fastify, options, done) => {

    fastify.decorateRequest('localization', null)


    fastify.addHook('onRequest', (request, reply, done) => {
        const cookies = request.parsedCookies

        const localization = localizations[cookies.language || LanguageSetting.Default.id]
        const table = {...localizations[LanguageSetting.English.id].localization, ...localization.localization}
        request.localization = table
        request.addHbParam('localization', table)
        request.addHbParam('localizationIsoCode', localization.isoCode)

        done()
    })
    
    done()
}

module.exports = fp(plugin);