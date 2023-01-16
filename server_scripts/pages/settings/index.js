const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts"

// settings page
const settingsPageOptions = {
    theme: {
        DisplayName: "Theme",
        Values: {
        "device-theme": {
            DisplayName: "Device Theme",
        },
        "light-theme": {
            DisplayName: "Light Theme",
        },
        "dark-theme": {
            DisplayName: "Dark Theme",
        }
        }
    },
    displayLanguage: {
        DisplayName: "Display Language",
        Values: {
        "Original": {
            DisplayName: "Native"
        },
        "Romaji": {
            DisplayName: "Romaji"
        },
        "English": {
            DisplayName: "English"
        }
        }
    } 
}
  
const postSettings = (request, reply) => {
    const body = request.body
    const parsedCookies = request.parsedCookies
    
    const analyticsNames = []
    const analyticsValues = []

    for ( let [cookieName, cookieValue] of Object.entries(body)) {
        // verify setting
        const exists = settingsPageOptions[cookieName]
        if (exists && exists.Values[cookieValue]) {
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
    const parsedCookies = request.parsedCookies
    
    const viewParams = { 
        seo: request.seo, 
        cookies: parsedCookies, 
        filterOptions: settingsPageOptions, 
        pageTitle: "Settings",
        referer: request.query.referer || "/"
     };
    
    return reply.view("pages/settings.hbs", viewParams)
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