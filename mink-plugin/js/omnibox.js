const omnibox = {}

omnibox.resetOmniboxToDefault = () => {
  chrome.omnibox.setDefaultSuggestion({'description' : 'Enter a URL for Mink to process'})
}

omnibox.clearOmniboxDefault = () => {
  chrome.omnibox.setDefaultSuggestion({'description': ' '})
}

omnibox.convertStringToURL = (string) => {
  if(string.indexOf('http') == -1) {
    string = `http://${string}`
  }

  if(string.indexOf('.') == -1) {
    return `${string}.com`
  }
  
  return string
}

export {omnibox}