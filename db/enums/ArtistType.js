module.exports = class ArtistType {
    static Singer = new ArtistType("Singer", 0)
    static Producer = new ArtistType("Producer", 1)

    static values = [this.Singer, this.Producer]

    /**
     * Returns a new ArtistType based on the id provided.
     * 
     * @param {number} id 
     * @returns A ArtistType enum that corresponds to the provided id 
     */
    static fromId(id) {
        return this.values[id] || Other
    }

    constructor(name, id) {
        this.name = name
        this.id = id
    }
}