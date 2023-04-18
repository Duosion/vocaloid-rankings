const AnalyticsToggleSetting = require("./enums/AnalyticsToggleSetting")
const AnimationToggleSetting = require("./enums/AnimationToggleSetting")
const LanguageSetting = require("./enums/LanguageSetting")
const ThemeSetting = require("./enums/ThemeSetting")
const TitleLanguageSetting = require("./enums/TitleLanguageSetting")

const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts"

// settings page

const settingsPageOptions = {
    'theme': {
        displayName: "settings_theme",
        defaultValue: ThemeSetting.DeviceTheme,
        values: ThemeSetting.values
    },
    'titleLanguage': {
        displayName: "settings_title_language",
        description: "settings_title_language_description",
        defaultValue: TitleLanguageSetting.English,
        values: TitleLanguageSetting.values
    },
    'language': {
        displayName: "settings_language",
        description: "settings_language_description",
        defaultValue: LanguageSetting.English,
        values: LanguageSetting.values
    },
    'animationToggle': {
        displayName: "settings_animations",
        defaultValue: AnimationToggleSetting.Enabled,
        values: AnimationToggleSetting.values
    },
    'analyticsToggle': {
        displayName: "settings_analytics",
        description: "settings_analytics_description",
        defaultValue: AnalyticsToggleSetting.Enabled,
        values: AnalyticsToggleSetting.values
    }
}
  
const postSettings = (request, reply) => {
    const body = request.body
    const parsedCookies = request.parsedCookies
    
    const analyticsNames = []
    const analyticsValues = []

    for ( let [cookieName, cookieValue] of Object.entries(body)) {
        // verify setting
        cookieValue = Number.parseInt(cookieValue)
        const exists = settingsPageOptions[cookieName]
        if (exists && exists.values[cookieValue]) {
            reply.setParamCookie(cookieName, cookieValue)

            const currentValue = parsedCookies[cookieName]

            if (!currentValue || currentValue != cookieValue) {
                analyticsNames.push(cookieName)
                analyticsValues.push(cookieValue)
            }
        }
    }

    // set analytics
    {
        const params = request.routeConfig["analyticsParams"]
        params["name"] = analyticsNames
        params["value"] = analyticsValues
    }
        
    reply.redirect("/settings")
}
  
const getSettings = (request, reply) => {

    request.addHbParam('filterOptions', settingsPageOptions)
    request.addHbParam('pageTitle', 'Settings')
    request.addHbParam('referer', request.query.referer || "/")
    
    return reply.view("pages/settings.hbs", request.hbParams)
}

exports.prefix = "/settings"

exports.settings = settingsPageOptions

exports.register = (fastify, options, done) => {
    fastify.post("/", {
        config: {
          analyticsEvent: "setting_change",
          analyticsParams: {'name': [], 'value': []}
        },
    }, postSettings)
    fastify.get("/", {
        config: {
          analyticsEvent: "page_visit",
          analyticsParams: {'page_name': "settings"}
        },
    },getSettings)

    done();
}