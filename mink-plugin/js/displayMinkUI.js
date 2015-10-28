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
   $('body').append(data);
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
}