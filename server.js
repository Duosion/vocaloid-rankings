// import npm modules
const path = require("path");

const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});
const schedule = require('node-schedule')
  
// import custom modules
const customModuleDirectory = "./server_scripts/"
const scraper = require( customModuleDirectory + "scraper")
const partializer = require(customModuleDirectory + "partializer")
const unitConverter = require(customModuleDirectory + "unitConverter")
const databaseProxy = require(customModuleDirectory + "database")
const { generateTimestamp, caches } = require(customModuleDirectory + "shared")

const database = require("./db")
const { addSongFromScraperData } = require(customModuleDirectory + "database")
  
// fastify stuff
  fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "public"),
    prefix: "/", // optional: default '/'
  });

  // register apis
    // v1
    {
      const v1 = require(customModuleDirectory + "api/v1/index")
      
      fastify.register(v1.register, { prefix: "/api" + v1.prefix})
    }

  // register cookie engine
    fastify.register(require('@fastify/cookie'), {
      secret: process.env.CookieSignatureSecret, // for cookies signature
      parseOptions: {}     // options for parsing cookies
    })

  // register plugins
  {
    const pluginDirectory = customModuleDirectory + "fastify_plugins/"
    const plugins = [
      "cookie.js",
      "seo.js",
      "authentication.js",
      "analytics.js",
      "outgoinglink.js"
    ]
    plugins.forEach(pluginName => {
      fastify.register(require(pluginDirectory + pluginName))
    })
  }

  // register formbody plugin
    fastify.register(require("@fastify/formbody"))

  // register templating engine
    const handlebars = require("handlebars")
    fastify.register(require("@fastify/view"), {
      engine: {
        handlebars: handlebars,
      },
      root: path.join(__dirname,"src"),
      layout: "/partials/layouts/main-desktop.hbs",
    });

    // handlebars helpers
      handlebars.registerHelper("get", (object, index) => {
        return object[index]
      })

      handlebars.registerHelper("comp", (comp1, comp2) => {
        return comp1 == comp2 ? true : null
      })

      handlebars.registerHelper("notcomp", (comp1, comp2) => {
        return comp1 != comp2 ? true : null
      })

      handlebars.registerHelper("inc", function(value, incAmount)
      {
          incAmount = parseInt(incAmount || 0)
          return parseInt(value) + incAmount
      })
      
      // timestamp helper
      handlebars.registerHelper("timestampToDateString", function(timestamp) {
        return (new Date(timestamp) || new Date()).toDateString()
      })

      // short format helper
      handlebars.registerHelper("shortFormat", (value) => {
        return unitConverter.shortFormat(value)
      })

      //long format helper
      handlebars.registerHelper("longFormat", (value) => {
        return unitConverter.longFormat(value)
      })

      // percentage format
      handlebars.registerHelper("percent", (value) => {
        return unitConverter.percentageFormat(value)
      })

    // register partials
    partializer.registerAll(handlebars)

  // load and parse seo data
  const seo = require("./src/seo.json");
  if (seo.url === "glitch-default") {
    seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
  }

// register page scripts
{
  const pagesDirectory = "./server_scripts/pages/"
  const pageScripts = [
    "rankings", // the rankings page
    "settings", // settings
    "song", // song pages (add/view)
  ]

  pageScripts.forEach(path => {
    const module = require(pagesDirectory + path);

    fastify.register(module.register, { prefix: module.prefix || "/"})

  });
}


// update songs data function
  let updatingSongsData = false
  const updateSongsData = () => {
    
    return new Promise( async (resolve, reject) => {
                                   
      if (updatingSongsData) { reject("Songs are already being updated."); return; }

      const timestampData = generateTimestamp()
      const timestamp = timestampData.Name

      console.log("Trying to update db for timestamp:", timestamp)
      if (await database.views.timestampExists(timestamp)) { reject("Database can only be updated once per day."); return; } // only update once per day

      databaseProxy.setUpdating(true)

      database.views.createViewsTable(timestamp)

      // variables
        const parseJson = JSON.parse

        const insertViewData = database.views.insertViewData

      const updateStartTime = new Date()
      console.log("Updating database.")
      
      // generate exclude urls list
      const songsDataExcludeURLs = {}
      const songsDataExcludeIDs = {}
      {

        const songs = await database.songs.getSongs()

        const problemSize = Object.keys(songs).length
        var progress = 0

        for (let [_, data] of Object.entries(songs)) {
          
          const songID = data.songId

          let URL = data.fandomURL

          //if (URL) {
            songsDataExcludeURLs[URL] = true
            songsDataExcludeIDs[songID] = true
            
            // refresh views only
            console.log("[Refresh]", songID)
            let views = await scraper.getVideoViewsAsync(parseJson(data.videoIds))
            
            views.songId = songID
            
            await insertViewData(timestamp, views)

            databaseProxy.setUpdatingProgress(++progress/problemSize)
            
          //}

        }

      }

      // create metadata
      await database.views.createMetadata(timestamp)

      // get scraper songs
      {
        const scraperSongs = await scraper.getSongsData(timestamp, songsDataExcludeURLs, songsDataExcludeIDs)
        for (const [_, scraperData] of scraperSongs.entries()) {
          await addSongFromScraperData(timestamp, scraperData.songData, scraperData.viewData)
        }
      }

      // get recent songs
      {
        const recentSongs = await scraper.getRecentSongs();
          // process
          for (const [_, songData] of recentSongs.entries()) {
            const songViews = songData.views
            const songId = songData.songId
            if (!songsDataExcludeIDs[songId]) {
              // calculate viewData
              const viewData = {
                songId: songId,
                total: 0,
                breakdown: {...songViews}
              }
              for (const [_, views] of Object.entries(songViews)) { viewData.total += views } // calculate total

              await addSongFromScraperData(timestamp, songData, viewData)
            }
          }

      }

      // purge caches
      caches.rankingsCache.purge()
      caches.songsDataCache.purge()
      caches.historicalCache.purge()

      databaseProxy.setUpdating(false)

      console.log(`Database updated. Took ${(new Date() - updateStartTime) / 1000} seconds.`)
      
      resolve()
    })
  }

  const updateSongsDataSafe = () => {
    updateSongsData().catch( (error) => { 
      console.log("Error occured when updating songs data:" ,error) 
    })
  }

  updateSongsDataSafe()
  schedule.scheduleJob('0 0 * * *', () => {
    updateSongsDataSafe()
  })

databaseProxy.repairSongThumbnails()

// redirect
fastify.get("/", async function (request, reply) {
  reply.redirect("/rankings")
});

// about page
fastify.get("/about", async (request, reply) => {
  const parsedCookies = request.parsedCookies
  
  const viewParams = { seo: seo, cookies: parsedCookies, scrapeDomains: scraper.scrapeDomains, pageTitle: "About"};
  
  return reply.view("pages/about.hbs", viewParams)
})

// download db

fastify.get("/download-db", (request, reply) => {
  const fs = require("fs");
  const archiver = require("archiver")

  const directory = "data/"

  if (fs.existsSync(directory)) {
      const archive = archiver("zip")

      archive.directory(directory)
  
      archive.finalize()

      reply.type("application/zip").send(archive)
  }
})

// run the server
fastify.listen(
  // process.env.PORT
  { port: process.env.PORT || 8080, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
    fastify.log.info(`server listening on ${address}`);
  }
);
