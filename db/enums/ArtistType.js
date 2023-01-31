const Enum = require("./Enum")

module.exports = class ArtistType extends Enum {
    static Vocaloid = new ArtistType("Vocaloid", 0)
    static CeVIO = new ArtistType("CeVIO", 1)
    static SynthesizerV = new ArtistType("SynthesizerV", 2)
    static Illustrator = new ArtistType("Illustrator", 3)
    static CoverArtist = new ArtistType("CoverArtist", 4)
    static Animator = new ArtistType("Animator", 5)
    static Producer = new ArtistType("Producer", 6)
    static OtherVocalist = new ArtistType("OtherVocalist", 7)
    static OtherVoiceSynthesizer = new ArtistType("OtherVoiceSynthesizer", 8)
    static OtherIndividual = new ArtistType("OtherIndividual", 9)
    static OtherGroup = new ArtistType("OtherGroup", 10)

    static {
        const enums = Object.values(this)

        const values = []
        const map = {}

        // build the values and map tables/objects
        enums.forEach(value => {
            values[value.id] = value
            map[value.name] = value
        })

        // add to object
        this.values = values
        this.map = map
    }
}