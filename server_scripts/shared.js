const xxhash = require("xxhash-wasm")
const { cacher } = require("./cacher")

// shared variables
exports.viewTypes = {
    "": {
      DisplayName: "Combined",
    },
    "YouTube": {
      DisplayName: "YouTube",
      VideoURL: "https://www.youtube.com/watch?v={VideoID}",
      Color: "#ff0000",
      BarColor: "#ff0000",
      TextColor: "#ffffff",
      Image: "https://cdn.glitch.global/92582474-1f68-4591-baa3-ef9e11ee2d8a/yt_logo_mono_dark.png?v=1656913418639"
    },
    "Niconico": {
      DisplayName: "Niconico",
      VideoURL: "https://www.nicovideo.jp/watch/{VideoID}",
      Color: "#ffffff",
      BarColor: "var(--text-color)",
      TextColor: "#222222",
      Image: "https://cdn.glitch.global/92582474-1f68-4591-baa3-ef9e11ee2d8a/Niconico_Official_Logo.png?v=1656914685484"
    },
    "bilibili": {
      DisplayName: "bilibili",
      VideoURL: "https://www.bilibili.com/video/{VideoID}",
      Color: "#079fd2",
      BarColor: "#079fd2",
      TextColor: "#ffffff",
      Image: "https://cdn.glitch.global/92582474-1f68-4591-baa3-ef9e11ee2d8a/bilibili.png?v=1657493806489"
    }
  }

exports.caches = {
  rankingsCache: new cacher(600), // initialize rankings cache with a 120 second lifespan
  songsDataCache: new cacher(600),
  historicalCache: new cacher(600)
}

// shared functions
exports.generateTimestamp = () => {
    let date = new Date()
    return {
        Name: date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2,'0') + "-" + String(date.getDate()).padStart(2,'0'),
        Timestamp: date
    }
}
  
let hash32;
exports.getHasherAsync = async () => {
    return hash32 || new Promise ( (resolve, reject) => {
        
        xxhash().then(hasher => {
            hash32 = hasher.h32ToString
            resolve(hash32) 
        }).catch(error => reject(error))
        
    })
}

exports.viewRegExps = {
  ["YouTube"]: {
    TextRegExp: /YouTube/i,
    IDRegExp: /https:\/\/www\.youtube\.com\/watch\?v=(.{11})/i,
  },
  ["Niconico"]: {
    TextRegExp: /Niconico/i,
    IDRegExp: /https:\/\/www.nicovideo.jp\/watch\/(.+)/i,
  },
  ["bilibili"]: {
    TextRegExp: /bilibili/i,
    IDRegExp: /https:\/\/www.bilibili.com\/video\/(.+)/i,
  }
}