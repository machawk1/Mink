chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.method == "store"){
    	console.log("STORING!");
    	localStorage.setItem('nelsonURI',request.value);
    	sendResponse({value: "noise"});
    } else if(request.method == "retrieve"){
    	console.log("RETRIEVING!");
    	//console.debug(localStorage.getItem("nelsonURI"));
      sendResponse({value: localStorage.getItem('nelsonURI')});
    }else if(request.method == "nukeFromOrbit"){
    	localStorage.removeItem('nelsonURI');
    }
  });