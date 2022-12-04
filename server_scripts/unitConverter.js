// converts numbers to different units

// tables
  const shortFormatSuffixes = ["k","M","B"]
  
// numbers
  const defaultDecimalPlaces = 1
  
// exported function

const decimalPlacesLimit = (number, decimalPlaces) => {
  decimalPlaces = decimalPlaces || defaultDecimalPlaces
  
  const expFactor = Math.pow(10, decimalPlaces)
  
  return Math.round(number * expFactor)/expFactor
  
}
  
const shortFormat = (number, decimalPlaces) => {
  if (number == 0) { return "0"; }
  
  decimalPlaces = decimalPlaces || defaultDecimalPlaces // the number of decimal places to keep
  
  for (let [index, suffix] of shortFormatSuffixes.entries()) {
    
    if (Math.pow(10, 3 * (index + 2)) > number) {
      
      const shortenedRaw = number / Math.pow(10, 3 * (index + 1))
      
      return decimalPlacesLimit(shortenedRaw, decimalPlaces) + suffix
      
    }
    
  }

  return decimalPlacesLimit(number, decimalPlaces)
  
}

const longFormat = (number, locale) => {
  
  return number.toLocaleString(locale)
  
}

const percentageFormat = (number, decimalPlaces) => {
  
  const percentage = number * 100 // turn into a full percentage value

  return decimalPlacesLimit(percentage, decimalPlaces) + "%"
  
}

exports.shortFormat = shortFormat;
exports.longFormat = longFormat;
exports.percentageFormat = percentageFormat;