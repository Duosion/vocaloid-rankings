const fp = require("fastify-plugin")
const LanguageSetting = require("../pages/settings/enums/LanguageSetting")

const localizations = [
    require("../../localization/template.json"),
    require("../../localization/en.json"),
    require("../../localization/jp.json")
]

const plugin = (fastify, options, done) => {


    fastify.addHook('onRequest', (request, reply, done) => {
        const cookies = request.parsedCookies

        const localization = localizations[cookies.language || LanguageSetting.Default.id] 

        request.localization = {...localizations[LanguageSetting.English.id], ...localization}

        done()
    })
    
    done()
}

module.exports = fp(plugin);