const workingDirectory = process.cwd()
// imports
const fp = require("fastify-plugin")
const { getHasherAsync } = require(workingDirectory + "/server_scripts/shared")
const { analyticsDataProxy } = require(workingDirectory + "/db")



// analytics events
const analyticsEvents = {
    // event_name: default params
    "page_visit": {"page_name": '', 'page_url': ''},
    "filter_add": {'name': [], 'value': []},
    "setting_change": {'name': [], 'value': []},
    "outgoing_url": {'url': ''},
    "search": {'query': ''}
}

// functions
const getUniqueId = async (request) => {
    // unique ID is a hash of the request's IP and user-agent
    return (await getHasherAsync())(request.ip + request.headers['user-agent'] || '')
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

        const eventName = config["analyticsEvent"]
        const eventParams = config["analyticsParams"]

        const defaultParams = analyticsEvents[eventName]
        if (defaultParams) {
            const params = {...defaultParams, ...eventParams}

            // get UID
            getUniqueId(req).then(uid => {
                switch (eventName) {
                    case "page_visit": {
                        // page_visit event
                        params['page_url'] = req.url
                        reply.setParamCookie("previousPage", req.url)
                        break
                    }
                    case "setting_change":
                    case "filter_add":
                        const names = params['name']
                        const values = params['value']
                        for (var i = 0; i<names.length; i++) {
                            analyticsDataProxy.insertEvent(eventName, uid, {'name': names[i], 'value': values[i]})
                        }
                        return
                }
                // save analytics
                analyticsDataProxy.insertEvent(eventName, uid, params)
            })
        }
        
        done()
    })

    done()
}

module.exports = fp(plugin);