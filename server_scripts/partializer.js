// registers partials with handlebars

// import stuff
  const fs = require("fs/promises") // file system
  const path = require("path"); // parh

// encoding & fs options
  const fileEncoding = "utf8"

  const defaultFsOptions = {
    encoding: fileEncoding
  }
  
// partial locations
  const workingDirectory = process.cwd()
  const partials = [
    path.join(workingDirectory, "/src/partials/includes"),
    path.join(workingDirectory, "/src/partials/layouts")
  ]

  
// functions
  const getPartialAsync = (filePath) => {
    
    return fs.readFile(filePath, defaultFsOptions)
    
  }
  
  const getFileName = (filePath) => {
    
    return filePath.split(".")[0]
    
  }
  
// exported functions
  const registerAll = async (handlebars) => {
    
    for (const [_, partialPath] of partials.entries()) {
      
      const files = await fs.readdir(partialPath)
      
      files.forEach( filePath => {
       
        const fileName = getFileName(filePath)
        
        getPartialAsync(path.join(partialPath, filePath)).then(partialText => {
          handlebars.registerPartial(fileName, partialText)
        })
        
      })
      
    }
    
  }
  
  
exports.registerAll = registerAll