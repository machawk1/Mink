function createShadowDOM() {
   var selector = '#minkuiX';
   
   var shadow = document.querySelector('#minkWrapper').createShadowRoot();
   var template = document.querySelector(selector);
   //var clone = document.importNode(template, true);
   shadow.appendChild(template);
}



function appendHTMLToShadowDOM() {
 $.ajax(chrome.extension.getURL('minkui.html'))
 .done(function(data) {
   console.log('TODO: before invoking any further, check to verify that some mementos exist (the aggregator query has returned).');
   
   $('body').append(data);
   
   var mementos = tmData.mementos.list; //e.g. mementos[15].uri and mementos[15].datetime
   
   var mementoSelections = '';
   for(var mm = 0; mm < mementos.length; mm++) {
     mementoSelections += '<option data-uri="' + mementos[mm].uri + '" data-datetime="'+ mementos[mm].datetime + '">' + mementos[mm].datetime + '</option>';
   }
   
   $('#mementosDropdown').append(mementoSelections);
   $('#mementosAvailable span').html(mementos.length);
   
   appendCSSToShadowDOM();
  });
}
 
function appendCSSToShadowDOM() {
  $.ajax(chrome.extension.getURL('css/minkui.css'))
   .done(function(data) {
    var styleElement = '<style type="text/css">\n' + data + '\n</style>\n';  
    $('#minkuiX').append(styleElement);
    createShadowDOM();
  });
}

if($('#minkWrapper').length == 0) {
  appendHTMLToShadowDOM();
} else {
  $('#minkWrapper').toggle();
}