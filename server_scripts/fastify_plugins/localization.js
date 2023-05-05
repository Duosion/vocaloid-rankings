const fp = require("fastify-plugin")
const LanguageSetting = require("../pages/settings/enums/LanguageSetting")
const acceptLanguageParser = require('accept-language-parser');

const localeLookup = {
    'en': require("../../localization/en.json"),
    'ja': require("../../localization/jp.json")
}

const plugin = (fastify, options, done) => {

    fastify.decorateRequest('localization', null)


    fastify.addHook('onRequest', (request, reply, done) => {
        const cookies = request.parsedCookies

        const settingCookie = cookies.language
        const localizationSetting = (settingCookie ? Number.parseInt(settingCookie) : 0) || LanguageSetting.Default.id
        let isoCode = 'en'
        let localization
        switch (localizationSetting) {
            case 0:
                const headers = request.headers || {}
                const acceptLanguage = headers['accept-language'] || 'en;q=1'
                const languages = acceptLanguageParser.parse(acceptLanguage)
                isoCode = languages ? languages[0].code : isoCode
                localization = localeLookup[isoCode]
                break
            case 2:
                isoCode = 'ja'
                localization = localeLookup['ja']
                break
            default:
                localization = localeLookup[isoCode];
                break
        }
        const table = {...localeLookup['en'], ...localization}
        request.localization = table
        request.addHbParam('localization', table)
        request.addHbParam('localizationIsoCode', isoCode)

        done()
    })
    
    done()
}

module.exports = fp(plugin);