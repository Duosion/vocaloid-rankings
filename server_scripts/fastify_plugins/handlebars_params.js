const fp = require("fastify-plugin")
const workingDirectory = process.cwd()


const plugin = (fastify, options, done) => {

    const seo = require(workingDirectory + "/src/seo.json");
    
    fastify.decorateRequest("addHbParam", function(name, value) {
        this.hbParams[name] = value
    })

    fastify.decorateRequest("addHbParams", function(dict) {
        const params =  this.hbParams
        for (const [key, val] of Object.entries(dict)) {
            params[key] = val
        }
    })

    fastify.addHook('onRequest', (request, reply, done) => {
        request.hbParams = {}
        
        request.addHbParam("seo", seo)

        done()
    })
    
    done()
}

module.exports = fp(plugin);