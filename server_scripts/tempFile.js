// bascially is a virtual memory module for tables
const fs = require("fs/promises") // file system
const jsonWriter = require("./jsonWriter")

const tempFilePath = process.cwd() + "/temp/"

class TempFile {
  
  #memory;
  #fileType;
  #autoSyncOffset;
  #autoSyncCharge = 0;
  
  #fileName;
  #filePath;
  
  constructor(tempFileOptions) {
    
    const fileType = tempFileOptions.fileType || "Array"
    const fileName = tempFileOptions.fileName
    
    this.#fileType = fileType
    this.#resetMemory()
    
    this.#autoSyncOffset = tempFileOptions.autoSyncOffset || 10
    
    this.#fileName = fileName;
    this.#filePath = tempFilePath + fileName + ".json";

  }
  
  #resetMemory() {
    
    this.#memory = this.#fileType == "Object" ? {} : []
    
  }
  
  #autoSync() {
    
    if ( (this.#autoSyncCharge + 1) >= this.#autoSyncOffset ) {
      
      this.#autoSyncCharge = 0;
      
      this.syncAsync()
      
    } else {
      
      this.#autoSyncCharge++
      
    }
    
  }
  
  async syncAsync() {
    // syncs this.#memory to the temp file path
    const memory = this.#memory
    this.#resetMemory()
    
    const filePath = this.#filePath
    const existing = await jsonWriter.getJSON(filePath)
    
    if (this.#fileType == "Object") {
      
      await jsonWriter.writeJSON(filePath, {...memory, ...existing})
      
    } else {
      
      await jsonWriter.writeJSON(filePath, Array.prototype.concat(existing, memory))
      
    }
    
  }
  
  async closeAsync() {
    // closes the temp file, deleting and syncing it
    
    const filePath = this.#filePath
    
    await this.syncAsync()

    const JSON = await jsonWriter.getJSON(filePath);

    await fs.unlink(filePath)
    
    return JSON
    
  }

  push(index, value) {
     
    if (value) {
      
      this.#memory[index] = value
      
    } else {
      
      this.#memory.push(index)
      
    }

    this.#autoSync()
    
  }
  
  
}

exports.TempFile = TempFile