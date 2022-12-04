const fp = require("fastify-plugin")
const workingDirectory = process.cwd()

const plugin = (fastify, options, done) => {

    const seo = require(workingDirectory + "/src/seo.json");
    if (seo.url === "glitch-default") {
        seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
    }

    fastify.addHook("onRequest", (req, reply, done) => {
        req.seo = seo
        
        done()
    })

    done()
}

module.exports = fp(plugin);