const fp = require("fastify-plugin")
const AnimationToggleSetting = require("../pages/settings/enums/AnimationToggleSetting")
const LanguageSetting = require("../pages/settings/enums/LanguageSetting")
const ThemeSetting = require("../pages/settings/enums/ThemeSetting")
const TitleLanguageSetting = require("../pages/settings/enums/TitleLanguageSetting")
const AnalyticsToggleSetting = require("../pages/settings/enums/AnalyticsToggleSetting")

const paramCookies = {
  // [cookie name]: [default value]
  titleLanguage: {
    DefaultValue: TitleLanguageSetting.English.id,
    AllowedValues: [TitleLanguageSetting.Native.id, TitleLanguageSetting.Romaji.id, TitleLanguageSetting.English.id],
    MaxAge: 31536000,
    AutoRenew: true,
  },
  theme: {
    DefaultValue: ThemeSetting.DeviceTheme.id,
    AllowedValues: [ThemeSetting.DeviceTheme.id, ThemeSetting.Light.id, ThemeSetting.Dark.id],
    MaxAge: 31536000,
    AutoRenew: true,
  },
  language: {
    DefaultValue: LanguageSetting.English.id,
    AllowedValues: [LanguageSetting.Default.id, LanguageSetting.English.id, LanguageSetting.Japanese.id, LanguageSetting.Spanish.id],
    MaxAge: 31536000,
    AutoRenew: true,
  },
  animationToggle: {
    DefaultValue: AnimationToggleSetting.Enabled.id,
    AllowedValues: [AnimationToggleSetting.Enabled.id, AnimationToggleSetting.Disabled.id],
    MaxAge: 31536000,
    AutoRenew: true,
  },
  analyticsToggle: {
    DefaultValue: AnalyticsToggleSetting.Enabled.id,
    AllowedValues: [AnalyticsToggleSetting.Enabled.id, AnalyticsToggleSetting.Disabled.id],
    MaxAge: 31536000,
    AutoRenew: true,
  }
}

const objectCookies = {
  filter: {
    MaxAge: null, // session cookie
    Signed: true
  },
  filterVocalist: {
    MaxAge: null,
    Signed: true
  },
  filterProducer: {
    MaxAge: null,
    Signed: true
  }
}

// parsers
const parseParamCookies = (request) => {

  const parsedCookies = {}

  for (const [cookieName, cookieData] of Object.entries(paramCookies)) {

    const rawCookie = request.cookies[cookieName]

    let parsedCookieValue = rawCookie;

    if (cookieData.Signed) {
      // this cookie is signed

      parsedCookieValue = request.unsignCookie(rawCookie)

    }

    // make sure value is valid
    const allowedValues = cookieData.AllowedValues

    if (allowedValues) {

      let allowed = false

      for (const [_, allowedValue] of allowedValues.entries()) {

        if (allowedValue == parsedCookieValue) { allowed = true; break; }

      }

      if (!allowed) {
        parsedCookieValue = null // reset the parsed cookie value
      }

    }

    parsedCookies[cookieName] = parsedCookieValue || cookieData.DefaultValue

  }

  return parsedCookies

}

const parseObjectCookies = (request) => {

  const parsedCookies = {}

  for (let [cookieName, cookieData] of Object.entries(objectCookies)) {

    const rawCookie = request.cookies[cookieName]

    if (rawCookie) {

      let parsedCookieValue = rawCookie;

      if (cookieData.Signed) {
        // this cookie is signed

        const unsigned = request.unsignCookie(rawCookie)

        parsedCookieValue = unsigned != null && unsigned.valid ? unsigned.value : ""

      }

      // parse the object
      const parsedCookie = {}

      parsedCookieValue.split("&").forEach(pairRaw => {

        const pair = pairRaw.split("=")

        const key = pair[0]
        const value = pair[1]

        if (key != null && value != null) {
          parsedCookie[key] = value
        }

      })
      
      
      parsedCookies[cookieName] = parsedCookie || cookieData.DefaultValue

    }

  }

  return parsedCookies
}

const cookieParsers = [
  parseParamCookies,
  parseObjectCookies
]

// setters
const setParamCookie = (reply, cookieName, cookieValue) => {
  const cookieData = paramCookies[cookieName]
  if (!cookieData) { return; }

  const allowedValues = cookieData.AllowedValues

  if (allowedValues) {

    let allowed = false;

    for (let [_, allowedValue] of allowedValues.entries()) {

      if (allowedValue == cookieValue) { allowed = true; break; }

    }

    if (!allowed) { return; }

  }

  reply.setCookie(cookieName, cookieValue, {
    path: "/",
    signed: cookieData.Signed,
    ["maxAge"]: cookieData.MaxAge,
  })
}

const setObjectCookie = (reply, cookieName, cookieValue) => {

  const cookieData = objectCookies[cookieName]
  if (!cookieData) { return; }

  // convert object to string

  const asStrings = []

  for (let [key, value] of Object.entries(cookieValue)) {
    asStrings.push(`${key}=${value}`)
  }

  const asString = asStrings.join("&")

  reply.setCookie(cookieName, asString, {
    path: "/",
    signed: cookieData.Signed,
    ["maxAge"]: cookieData.MaxAge
  })

}

const plugin = (fastify, options, done) => {

  fastify.decorateRequest("parsedCookies", null)

  fastify.decorateReply("setParamCookie", function (name, value) {
    setParamCookie(this, name, value)
  })
  fastify.decorateReply("setObjectCookie", function (name, value) {
    setObjectCookie(this, name, value)
  })

  // cookie parsing
  fastify.addHook("onRequest", (req, reply, done) => {
    var parsedCookies = {}

    for (const [_, parser] of cookieParsers.entries()) {
      parsedCookies = {
        ...parsedCookies,
        ...parser(req)
      }
    }

    req.parsedCookies = parsedCookies
    req.addHbParam('cookies', parsedCookies)

    done()
  })

  done()
}

module.exports = fp(plugin);