// handles outgoing links
// imports
const fp = require("fastify-plugin")

const outgoingGet = async(request, reply) => {
    const link = request.query["url"]

    if (!link) { reply.redirect("/"); return }

    request.setAnalyticsParam("url", link)

    reply.redirect(301,link);
}

// plugin
const plugin = (fastify, options, done) => {

    // requests
    fastify.get("/outgoing",{
        config: {
          analyticsEvent: "outgoing_url",
          analyticsParams: {'url': ""}
        },
      }, outgoingGet)

    done()
}

module.exports = fp(plugin);