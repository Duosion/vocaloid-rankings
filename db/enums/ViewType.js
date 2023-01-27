module.exports = class SongType {
    static YouTube = new SongType("YouTube", 0)
    static Niconico = new SongType("Niconico", 1)
    static bilibili = new SongType("bilibili", 2)

    static values = [this.YouTube, this.Niconico, this.bilibili]

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