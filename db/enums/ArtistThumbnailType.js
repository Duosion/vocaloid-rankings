module.exports = class ArtistThumbnailType {
    static Original = new ArtistThumbnailType("Original", 0)
    static Medium = new ArtistThumbnailType("Medium", 1)
    static Small = new ArtistThumbnailType("Small", 2)
    static Tiny = new ArtistThumbnailType("Tiny", 3)

    static values = [this.Original, this.Medium, this.Small, this.Tiny]

    /**
     * Returns a new ArtistThumbnailType based on the id provided.
     * 
     * @param {number} id 
     * @returns A ArtistThumbnailType enum that corresponds to the provided id 
     */
    static fromId(id) {
        return this.values[id] || Other
    }

    constructor(name, id) {
        this.name = name
        this.id = id
    }
}