// handles locale
const NameType = require("../db/enums/NameType")

// tables
  const preferredLanguagePriorities = [
    [NameType.Original, NameType.Japanese], // Original
    [NameType.Original, NameType.Japanese], // Japanese
    [NameType.English, NameType.Romaji], // English
    [NameType.Romaji, NameType.English], // Romaji
  ]

// exports

  // exported functions
    /**
     * Returns the preferred name for the provided array of names.
     * 
     * @param {number[]} names 
     * @param {NameType} preferredLanguage 
     * @returns 
     */
    exports.getPreferredLanguageName = (names, preferredLanguage) => {
      const priorityTree = preferredLanguagePriorities[preferredLanguage.id]

      if (priorityTree) {
        for (const [_, nameIndex] of priorityTree.entries()) {
          const name = names[nameIndex.id]
          if (name) { return name }
        }
      }

      return names[NameType.Original.id] // default to the original name
    }