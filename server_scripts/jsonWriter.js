const fs = require("fs/promises") // file system
const jsonfile = require("jsonfile")

const fileEncoding = "utf8"

const defaultFsOptions = {
  encoding: fileEncoding
}

// functions
function getExtension(filename) {
    return filename.split('.').pop();
}

// exported functions
const existsAsync = (filePath) => {
  
  return new Promise( async (resolve, reject) => {
    
    fs.stat(filePath).then(() => resolve(true))
                     .catch(() => resolve(false))
    
  })
  
}

const getJSON = async (filePath) => {
  
  
  return jsonfile.readFile(filePath).catch( () => {
    return []
  })
  /*
  return new Promise( async (resolve, reject) => {
    
    //if (!extensionsWhitelist[getExtension(filePath)]) { reject("Invalid file path."); return; }
    
    
    
    /*let encodedJSON = "[]";
    await fs.readFile(filePath).then(encoded => {
      encodedJSON = encoded
    }).catch(error => {})
    
    // json decode
    
    try {
      
      let parsed = JSON.parse(encodedJSON)
      
      resolve(parsed)
      
    } catch (error) {
      
      reject(error)
      
    }*/
    
  //})
  
}

const writeJSON = async (filePath, data) => {

  return jsonfile.writeFile(filePath, data)
  
  /*return new Promise( async (resolve, reject) => {
    
    if (!extensionsWhitelist[getExtension(filePath)]) { reject("Invalid file path."); return; }
    
    // attempt to encode json
      let encodedJSON;

      try {

        encodedJSON = JSON.stringify(data)

      } catch (error) {

        reject(error)
        return;

      }
    
    
    // write file
    fs.writeFile(filePath, encodedJSON).then( () => resolve(encodedJSON) )
                                                          .catch( (error) => reject(error) )
    
  })*/
  
}

exports.getJSON = getJSON;
exports.writeJSON = writeJSON;
exports.existsAsync = existsAsync;