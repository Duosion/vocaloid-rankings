// handles locale

// tables
  const preferredLanguagePriorities = {

    Original: ["Original", "Japanese"],
    Romaji: ["Romaji", "English"],
    English: ["OfficialEnglish", "English", "Romaji"],

  }

// exports

  // exported functions
    exports.getPreferredLanguageName = (names, preferredLanguage) => {
      const priorityTree = preferredLanguagePriorities[preferredLanguage]

      if (priorityTree) {
        for (let [_, nameIndex] of priorityTree.entries()) {

          const name = names[nameIndex]
          if (name) { return name }

        }
      }

      return names.Original // default to the original name
    }