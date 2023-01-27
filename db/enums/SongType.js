module.exports = class SongType {
    static Vocaloid = new SongType("Vocaloid", 0)
    static CeVIO = new SongType("CeVIO", 1)
    static SynthesizerV = new SongType("SynthesizerV", 2)
    static Other = new SongType("Other", 3)

    static values = [this.Vocaloid, this.CeVIO, this.SynthesizerV, this.Other]

    /**
     * Returns a new SongType based on the id provided.
     * 
     * @param {number} id 
     * @returns A SongType enum that corresponds to the provided id 
     */
    static fromId(id) {
        return this.values[id] || Other
    }

    constructor(name, id) {
        this.name = name
        this.id = id
    }
}