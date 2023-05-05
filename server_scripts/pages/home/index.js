const fastify = require("fastify")

const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts"

// fastify routes
const getPage = (request, reply) => {
  request.addHbParam('pageTitle', (request.localization || {})['home_rankings'])
  return reply.view('pages/home.hbs', request.hbParams)
}

exports.register = (fastify, options, done) => {
  fastify.get("/", getPage)

  done()
}