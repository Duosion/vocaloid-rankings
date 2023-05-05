const xxhash = require("xxhash-wasm")
const { cacher } = require("./cacher")
const { getAverageColor } = require("fast-average-color-node")
const ArtistCategory = require("../db/enums/ArtistCategory")
const ArtistType = require("../db/enums/ArtistType")

// shared variables

exports.getAverageColorAsync = (input) => {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(await getAverageColor(input))
    } catch (error) {
      resolve({
        hex: "#ffffff"
      })
    }
  })
} 

exports.viewTypesDisplayData = [
  {
    displayName: "youtube",
    videoURL: "https://www.youtube.com/watch?v={VideoID}",
    color: "#ff0000",
    colors: ['#ff0000', '#dc0000', '#c90000', '#a90000', '#960000'],
    textColor: '#ffffff',
    icon: "/images/yt_icon.png"
  },
  {
    displayName: 'niconico',
    videoURL: "https://www.nicovideo.jp/watch/{VideoID}",
    color: "#ffffff",
    colors: ['#ffffff', '#d5d5d5', '#bbbbbb', '#a5a5a5', '#888888'],
    textColor: '#000000',
    textShadow: '1px 1px 0 #000, 1px 1px 0 #000, 1px 1px 0 #000;',
    icon: '/images/nico_icon.png'
  },
  {
    displayName: "bilibili",
    videoURL: 'https://www.bilibili.com/video/{VideoID}',
    color: "#079fd2",
    colors: ['#079fd2', '#068cb8', '#05769b', '#045e7c', '#04516b'],
    textColor: "#ffffff",
    icon: '/images/bili_icon.png'
  }
]

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
      Image: "/images/yt_icon.png"
    },
    "Niconico": {
      DisplayName: "Niconico",
      VideoURL: "https://www.nicovideo.jp/watch/{VideoID}",
      Color: "#ffffff",
      BarColor: "var(--md-sys-color-on-surface)",
      TextColor: "var(--md-sys-color-surface)",
      Image: "/images/nico_icon.png"
    },
    "bilibili": {
      DisplayName: "bilibili",
      VideoURL: "https://www.bilibili.com/video/{VideoID}",
      Color: "#079fd2",
      BarColor: "#079fd2",
      TextColor: "#ffffff",
      Image: "/images/bili_icon.png"
    }
  }

exports.caches = {
  rankingsCache: new cacher(3600), // initialize rankings cache with a 120 second lifespan
  queryCache: new cacher(3600), // caches rankings queries
  songsDataCache: new cacher(3600),
  historicalCache: new cacher(3600),
  highlightsCache: new cacher(3600),
  searchCache: new cacher(300), // search cache 5 minutes
  thumbnailCache: new cacher(1800), // thumbnail cache - 30 minutes
  artistsDataCache: new cacher(3600) // artist cache - 60 minutes
}

// shared functions
exports.generateTimestamp = (customDate) => {
    const date = customDate || new Date()
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

exports.getRandomInt = (max) => {
  return Math.floor(Math.random() * max)
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

exports.rankingsFilterQueryTemplate = {
  MaxEntries: {
    default: 50,
    min: 0,
    max: 50
  }, // the maximum # of entries to return
  StartAt: {
    default: 0
  }, // the maximum # of entries to return
  
  Date: {
    default: ""
  },
  DaysOffset: {
    default: 0
  },

  ViewType: {
    default: "Combined"
  },

  Producer: {
    default: ""
  },
  Singer: {
    default: ""
  },
  SongType: {
    default: "All"
  },

  TimePeriod: {
    default: "AllTime"
  },
  Direction: {
    default: "Descending"
  },
  SortBy: {
    default: "Views"
  },

  Language: {
    default: "Original"
  },

  PublishYear: {
    default: ""
  }
}

exports.artistTypesWhitelists = {
  [ArtistCategory.Vocalist.id]: [ArtistType.Vocaloid, ArtistType.CeVIO, ArtistType.SynthesizerV, ArtistType.UTAU, ArtistType.OtherVocalist, ArtistType.OtherVoiceSynthesizer],
  [ArtistCategory.Producer.id]: [ArtistType.Producer, ArtistType.Animator, ArtistType.CoverArtist, ArtistType.Illustrator, ArtistType.OtherGroup, ArtistType.OtherIndividual]
}

exports.historicalDataQueryTemplate = {
  Range: {
    default: 7,
    min: 0,
    max: 7
  }, // the default range (how many data points will exist)
  
  TimePeriod: {
    default: "Daily"
  }, // the time period
  
  SongId: {
    default: ""
  }, 
}

/**
 * Verifies a set of parameters against 'verifyAgainst'
 * 
 * @param {Object} toVerify The parameters to verify.
 * @param {Object} verifyAgainst The parameter template to verify against.
 */
exports.verifyParams = (toVerify, verifyAgainst) => {
  const verified = {}

  for (const [paramName, paramData] of Object.entries(verifyAgainst)) {
    const defaultValue = paramData.default
    var validatedValue = defaultValue
    const toVerifyValue = toVerify[paramName]

    const defaultType = typeof(defaultValue)

    // attempt to convert values
    if (toVerifyValue) {
      try {
        switch (defaultType) {
          case "number": {
            validatedValue = Number(toVerifyValue)
            // clamp number
            const min = paramData.min
            const max = paramData.max
            if (min || max) {
              if (min && max) {
                validatedValue = Math.max(min, Math.min(max, validatedValue))
              } else if (max) {
                validatedValue = Math.min(max, validatedValue)
              } else if (min) {
                validatedValue = Math.max(min, validatedValue)
              }
            }
            break;
          }
          default:
            validatedValue = toVerifyValue
        }
      } catch (error) {
        validatedValue = defaultValue
      }
    }
    verified[paramName] = validatedValue
  }
  return verified
}