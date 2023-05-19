const workingDirectory = process.cwd()
// imports
const fp = require("fastify-plugin")
const AnalyticsEvent = require("../../db/enums/AnalyticsEvent")
const AccessLevel = require("../../db/enums/AccessLevel")
const { getHasherAsync } = require(workingDirectory + "/server_scripts/shared")
const { analyticsDataProxy } = require(workingDirectory + "/db")



// analytics events
const analyticsEvents = {
    // event_name: default params
    [AnalyticsEvent.PageVisit.id]: {"page_name": '', 'page_url': ''},
    [AnalyticsEvent.FilterAdd.id]: {'name': [], 'value': []},
    [AnalyticsEvent.SettingChange.id]: {'name': [], 'value': []},
    [AnalyticsEvent.OutgoingUrl.id]: {'url': ''},
    [AnalyticsEvent.Search.id]: {'query': ''}
}

// functions
const getUniqueId = async (request) => {
    // unique ID is a hash of the request's IP and user-agent
    const headers = request.headers
    return (await getHasherAsync())(request.ip + headers['user-agent'] || '' + (headers['accept-language'] || ''))
}

const plugin = (fastify, options, done) => {

    fastify.decorateRequest("setAnalyticsParam", function(name, value) {
        const config = this.routeConfig
        if (config != null) {
            config["analyticsParams"][name] = value
        }
    })

    fastify.addHook("onResponse", (req, reply, done) => {
        const config = req.routeConfig

        const event = config["analyticsEvent"]
        const eventParams = config["analyticsParams"]
        const defaultParams = event && analyticsEvents[event.id]
        if (defaultParams && (req.accessLevel < AccessLevel.Admin.id)) {
            const params = {...defaultParams, ...eventParams}
            
            // get UID
            getUniqueId(req).then(uid => {
                switch (event) {
                    case AnalyticsEvent.PageVisit: {
                        // page_visit event
                        params['page_url'] = req.url
                        reply.setParamCookie("previousPage", req.url)
                        break
                    }
                    case AnalyticsEvent.SettingChange:
                    case AnalyticsEvent.FilterAdd:
                        const names = params['name']
                        const values = params['value']
                        for (var i = 0; i<names.length; i++) {
                            analyticsDataProxy.insertEvent(event, uid, {'name': names[i], 'value': values[i]})
                        }
                        return
                }
                // save analytics
                analyticsDataProxy.insertEvent(event, uid, params)
            })
        }
        
        done()
    })

    done()
}

module.exports = fp(plugin);