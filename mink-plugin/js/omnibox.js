chrome.omnibox.onInputStarted.addListener(function cb() {
  console.log('The user is utilizing the omnibox');
  resetOmniboxToDefault();
});

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
  console.log('TODO: check if ' + text + ' is a valid URL. Transpose if not and display via the "suggest" callback');
  if(text === '') {
    resetOmniboxToDefault();
    return;
  }  
  
  clearOmniboxDefault();
  var url = convertStringToURL(text);
  
  suggest([{'content': 'mink://' + text, 'description': 'Fetch mementos for  ' + url + '?'}]);
});

chrome.omnibox.onInputEntered.addListener(function(text, disposition) {
 console.log('Mink value from omnibox: ' + text);
 console.log('Disposition: ');
 console.log(disposition);
});

chrome.omnibox.onInputCancelled.addListener(function cb() {
  console.log('TODO: stop UI animation/changes, reset to pre-omnibox entry state.');
});


function resetOmniboxToDefault() {
  chrome.omnibox.setDefaultSuggestion({'description' : 'Enter a URL for Mink to process'});
}

function clearOmniboxDefault() {
  chrome.omnibox.setDefaultSuggestion({'description': ' '});
}

function convertStringToURL(string) {
  if(string.indexOf('http') == -1) {
    string = 'http://' + string;
  }

  if(string.indexOf('.') == -1) {
    return string + '.com';
  }
  
  return string;
}