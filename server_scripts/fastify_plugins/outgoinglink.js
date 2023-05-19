// handles outgoing links
// imports
const fp = require("fastify-plugin");
const AnalyticsEvent = require("../../db/enums/AnalyticsEvent");

const hostNameWhitelist = {
  ['vocadb.net']: true,
  ['www.youtube.com']: true,
  ['www.nicovideo.jp']: true,
  ['www.bilibili.com']: true,
}

const outgoingGet = async(request, reply) => {
    const link = request.query["url"]

    if (!link) { reply.redirect("/"); return }

    // validate the URL
    try {
      const url = new URL(link)
      const whitelisted = hostNameWhitelist[url.hostname]
      if (!whitelisted) {
        return reply.status(400).send({
          statusCode: 400,
          message: 'Invalid URL provided.'
        })
      }
    } catch (error) {
      return reply.status(500).send({
        statusCode: 500,
        message: error
      })
    }
    
    request.setAnalyticsParam("url", link)
    reply.redirect(301, link);
}

// plugin
const plugin = (fastify, options, done) => {

    // requests
    fastify.get("/outgoing",{
        config: {
          analyticsEvent: AnalyticsEvent.OutgoingUrl,
          analyticsParams: {'url': ""}
        },
      }, outgoingGet)

    done()
}

module.exports = fp(plugin);