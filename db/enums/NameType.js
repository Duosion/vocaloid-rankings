module.exports = class NameType {
    static Original = new NameType("Original", 0)
    static Japanese = new NameType("Japanese", 1)
    static English = new NameType("English", 2)
    static Romaji = new NameType("Romaji", 3)

    static values = [this.Original, this.Japanese, this.English, this.Romaji]

    /**
     * Returns a new NameType based on the id provided.
     * 
     * @param {number} id 
     * @returns A NameType enum that corresponds to the provided id 
     */
    static fromId(id) {
        return this.values[id] || Other
    }

    constructor(name, id) {
        this.name = name
        this.id = id
    }
}