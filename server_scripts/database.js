// is basically a proxy for database files

// import modules
//const jsonWriter = require("./jsonWriter")

// functions

var databaseUpdating = null;

const getUpdating = () => {
  // returns whether the database is updating
  return databaseUpdating
}

const setUpdating = (status) => {
  // sets whether or not the database is updating
  const exists = databaseUpdating ? true : false

  if (status && !exists) {

    databaseUpdating = {
      progress: 0
    }

  } else if (!status && exists) {

    databaseUpdating = null

  }
}

const setUpdatingProgress = (newProgress) => {
  // updates the updating progress
  if (!databaseUpdating) { return }

  databaseUpdating.progress = Math.min(1, newProgress)

}

// export variables
exports.getUpdating = getUpdating
exports.setUpdating = setUpdating
exports.setUpdatingProgress = setUpdatingProgress