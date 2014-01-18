chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.method == "store"){
    	console.log("STORING!");
    	localStorage.setItem('nelsonURI',request.value);
    	localStorage.setItem('mementos',request.mementos);
    	console.log("mementos");
    	console.log(request.mementos);
    	sendResponse({value: "noise"});
    } else if(request.method == "retrieve"){
    	console.log("RETRIEVING!");
    	//console.debug(localStorage.getItem("nelsonURI"));
      sendResponse({value: localStorage.getItem('nelsonURI'),mementos: localStorage.getItem('mementos')});
    }else if(request.method == "nukeFromOrbit"){
    	localStorage.removeItem('nelsonURI');
    }
  });