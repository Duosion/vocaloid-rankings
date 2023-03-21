const Enum = require("./Enum")

module.exports = class ArtistType extends Enum {
    static Vocaloid = new ArtistType("filter_artist_type_vocaloid", 0)
    static CeVIO = new ArtistType("filter_artist_type_cevio", 1)
    static SynthesizerV = new ArtistType("filter_artist_type_synth_v", 2)
    static Illustrator = new ArtistType("filter_artist_type_illustrator", 3)
    static CoverArtist = new ArtistType("filter_artist_type_cover_artist", 4)
    static Animator = new ArtistType("filter_artist_type_animator", 5)
    static Producer = new ArtistType("filter_artist_type_producer", 6)
    static OtherVocalist = new ArtistType("filter_artist_type_other_vocalist", 7)
    static OtherVoiceSynthesizer = new ArtistType("filter_artist_type_other_voice_synth", 8)
    static OtherIndividual = new ArtistType("filter_artist_type_other_individual", 9)
    static OtherGroup = new ArtistType("filter_artist_type_other_group", 10)
    static UTAU = new ArtistType('filter_artist_type_utau', 11)

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