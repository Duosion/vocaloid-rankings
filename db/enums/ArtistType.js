const ArtistCategory = require("./ArtistCategory")

module.exports = class ArtistType {
    static Vocaloid = new ArtistType("filter_artist_type_vocaloid", 0, ArtistCategory.Vocalist)
    static CeVIO = new ArtistType("filter_artist_type_cevio", 1, ArtistCategory.Vocalist)
    static SynthesizerV = new ArtistType("filter_artist_type_synth_v", 2, ArtistCategory.Vocalist)
    static Illustrator = new ArtistType("filter_artist_type_illustrator", 3, ArtistCategory.Producer)
    static CoverArtist = new ArtistType("filter_artist_type_cover_artist", 4, ArtistCategory.Vocalist)
    static Animator = new ArtistType("filter_artist_type_animator", 5, ArtistCategory.Producer)
    static Producer = new ArtistType("filter_artist_type_producer", 6, ArtistCategory.Producer)
    static OtherVocalist = new ArtistType("filter_artist_type_other_vocalist", 7, ArtistCategory.Vocalist)
    static OtherVoiceSynthesizer = new ArtistType("filter_artist_type_other_voice_synth", 8, ArtistCategory.Vocalist)
    static OtherIndividual = new ArtistType("filter_artist_type_other_individual", 9, ArtistCategory.Producer)
    static OtherGroup = new ArtistType("filter_artist_type_other_group", 10, ArtistCategory.Producer)
    static UTAU = new ArtistType('filter_artist_type_utau', 11, ArtistCategory.Vocalist)

    /**
     * 
     * @param {string} name 
     * @param {number} id 
     * @param {ArtistCategory} category 
     */
    constructor(name, id, category) {
        this.name = name
        this.id = id
        this.category = category
    }

    /**
     * Returns a new ArtistType based on the id provided.
     * 
     * @param {number} id 
     * @returns A ArtistType enum that corresponds to the provided id 
     */
    static fromId(id) {
        return this.values[id]
    }

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