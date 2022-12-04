class CachedItem {
  
  #id;
  #data;
  #lifespan
  
  constructor(cacheID, cacheData, lifespan) {
    
    this.#id = cacheID
    this.#data = cacheData
    this.#lifespan = lifespan
    
  }
  
  getLifespan() {
    return this.#lifespan
  }
  
  getData() {
    
    return this.#data
    
  }
  
}

class Cacher {
  
  #cache;
  #defaultLifespan; // the default cache lifespan
  
  constructor(defaultCacheLifespan) {
    
    this.#cache = {} // store the cache
    this.#defaultLifespan = (defaultCacheLifespan || 60) * 1000 // initialize lifespan and convert to ms
    
  }
  
  get(cachedItemID) {
    
    return this.#cache[cachedItemID]
    
  }

  purge() {
    // purges the cache completely
    const cache = this.#cache

    for (let [_, itemId] of Object.entries(cache)) {
      delete cache[itemId]
    }

    this.#cache = {} // replace table

  }
  
  remove(cachedItemID) {
    // removes the cached item with the provided id
    if (!this.get(cachedItemID)) { throw("Cached item with ID '" + cachedItemID + "' does not exists.'") }
    
    delete this.#cache[cachedItemID]
    
  }
  
  set(cachedItemID, cachedItemData, cacheTime) {
    if (this.get(cachedItemID)) { return }
    
    cacheTime = cacheTime || this.#defaultLifespan
    
    const newCachedItem = new CachedItem(cachedItemID, cachedItemData)
    
    this.#cache[cachedItemID] = newCachedItem
    
    // set cache timeout
    setTimeout(() => {
      console.log(cachedItemID,"Expiry")
      
      this.remove(cachedItemID)
      
    }, cacheTime) // convert cacheTime to ms 
    
    return newCachedItem
    
  } 
  
}

exports.cacher = Cacher