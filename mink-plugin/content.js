var debug = true;

var proxy = "http://timetravel.mementoweb.org/timemap/link/";
var aggregator_wdi_link = "http://labs.mementoweb.org/timemap/link/";
var aggregator_wdi_json = "http://labs.mementoweb.org/timemap/json/";
var aggregator_diy_link = "http://timetravel.mementoweb.org/timemap/link/";
var aggregator_diy_json = "http://timetravel.mementoweb.org/timemap/json/";
var numberOfTimemaps = 0;

var embeddedTimemapRegex = /<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\"timemap\"/g;
var mementosURIsWithinTimemapsRegex = /<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\".*memento.*\"/g;
var timemapsURIsWithinTimemapsRegex = /<https?:.*>;rel=\".*timemap.*\"/g;

var mementosInTimemapBasedOnRelAttributeRegex = /;rel=\".*memento.*\"/g;
var timemapsInTimemapBasedOnRelAttributeRegex = /;rel=\".*timemap.*\"/g;


//PENDING, Issue #6, not possible w/o Chrome Canary: $.scoped(); //allows the usage of bootstrap without affecting the target page's style

$("body").append("<div id=\"minkContainer\"></div>");
//PENDING, Issue #6, not possible w/o Chrome Canary: $("#minkContainer").append("<style scoped>\r\n@import url('"+bootstrapCSS+"');\r\n</style>");
$("#minkContainer").append("<style type=\"text/css\" scoped=\"scoped\">\r\n"+
	"#minkContainer * {font-size: 12px; font-family: Helvetica, sans-serif; text-transform: none;}\r\n"+
	"#minkContainer input[type=button] { background-color: white; border: 1px double black; padding: 2px 5px 2px 5px; border-radius: 5px; font-weight: bold;}\r\n"+
	"#minkContainer input[type=button]:enabled:hover {cursor: pointer; background-color: #ccc; }"+
	"#minkContainer input[type=button]:disabled:hover {cursor: not-allowed; }"+
	"#minkContainer input[type=button]:disabled {opacity: 0.25; }"+
"</style>");
//$.scoped();
$("#minkContainer").append("<div id=\"archiveOptions\"></div>");
$("#minkContainer").append("<img src=\""+iconUrl+"\" id=\"mLogo\" />");



setTimeout(flip,1000);

$(document).ready(function(){
	$("#mLogo").click(function(){
		showArchiveOptions();

	});
	displayUIBasedOnContext();

});


var jsonizedMementos = "[";
var jsonizedMementos;

function addToHistory(uri_r,memento_datetime,mementos,callback){
	var mementosToStore = mementos;
	if(!mementosToStore){mementosToStore = jsonizedMementos;}
	chrome.runtime.sendMessage({method: "store", value: ""+uri_r, memento_datetime: memento_datetime, mementos: mementosToStore}, function(response) {
		if(callback){
			callback();
		}
	});
}

function clearHistory(){
	chrome.runtime.sendMessage({method: "nukeFromOrbit", value: "It's the only way to be sure"}, function(response) {});
}


/** When viewing a memento, handles the UI and navigation change of jumping to another memento
 *  @param index A value representative of the location of the new memento on the list, 1 = next, -1 = prev, 0/null = selected in UI
 */
function viewDifferentMemento(index){
	chrome.runtime.sendMessage({method: "retrieve"}, function(response) {
		if(index == null || index == 0){
			addToHistory(response.value,$("#mdts option:selected").text(),response.mementos, //Save the Memento-Datetime of option chosen to localStorage
				function(){window.location = $("#mdts").val();}
			);
		}else if(index == 1){ //next Memento
			var nextMemento = $("#mdts option:nth-child("+(parseInt($("#mdts").attr("alt"))+2)+")");
			addToHistory(response.value,nextMemento.text(),response.mementos, //Save the Memento-Datetime of option chosen to localStorage
				function(){window.location = nextMemento.val();}
			);
		}else if(index == -1){ //prev Memento
			var prevMemento = $("#mdts option:nth-child("+(parseInt($("#mdts").attr("alt")))+")");
			addToHistory(response.value,prevMemento.text(),response.mementos, //Save the Memento-Datetime of option chosen to localStorage
				function(){window.location = prevMemento.val();}
			);
		}else {
			console.log("Bad index value in viewDifferentMemento, "+index);
			console.log(index);
		}
	});
}

function ceaseQuery(){ //stop everything (AND DANCE!)
	alert("Halting execution");
}

function displayUIBasedOnContext(){
	chrome.runtime.sendMessage({method: "retrieve"}, function(response) {
		if(response == null || response.value == window.location || response.value == null){ // ON A LIVE WEB PAGE, FETCH MEMENTOS
			$("#archiveOptions").html("Fetching Mementos...<button onclick=\"ceaseQuery();\" style=\"margin-left: 1.0em;\">Halt and Catch Fire</button>");
			getMementos();
		}else if(response && response.value != null && 										//ON AN ARCHIVED PAGE, SHOW RETURN TO LIVE WEB BUTTON
				( ((window.location+"").indexOf(response.value) > -1) ||					//check if URI-R is in URI-M
				  ((window.location+"").replace("www.","").indexOf(response.value) > -1) ||	// 3 hacky attempts at removing the www to further accomplish this
				  ((window.location+"").indexOf(response.value.replace("www.","")) > -1) ||
				  ((window.location+"").replace("www.","").indexOf(response.value.replace("www.","")) > -1)
				) 																	// There were memento HTTP headers
			){
			logoInFocus = true;

			//Display UI For When Browsing An Archive Page
			displayReturnToLiveWebButton(response.value);

			//$("#archiveOptions").append(getMementosNavigationBasedOnJSON(response.mementos,response.memento_datetime));
			//$("#viewMementoButton").click(viewDifferentMemento); //this is different from the live web context, as we don't store the URI-M in localStorage but instead, remember the URI-R there

			//setMementoButtonInteractivityBasedOnMementoDropdown();
		}else {
			if(debug){console.log("There is no else, only if");}
			//ugh, we don't want to be here, let's nuke the localStorage
			clearHistory();
			displayUIBasedOnContext();
		}
	  });
}

function isEmpty(o){ //returns if empty object is passed in
    for(var i in o){
        if(o.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
}


function displayReturnToLiveWebButton(uri){
		//Display UI For When Browsing An Archive Page
		$("#archiveOptions").html("<button id=\"liveWeb\">Return to Live Web</button>");
		$("#liveWeb").click(function(){window.location = (uri ? uri : response.value);});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.method == "hideUI"){
		$("#minkContainer").fadeOut();
		return;
	}

	if(request.method == "showArchiveNowUI"){
		if(debug){console.log("Hide logo here");}
		logoInFocus = true;
		hideLogo = true;

		return;
	}

	if(request.method == "getMementosFromSecureSource"){
		logoInFocus = true;
		hideLogo = true;
	}

	if(request.method == "displayThisMementoData"){
		//Parse the data received from the secure source and display the number of mementos
		var tm = new Timemap(request.data);
		displayUIBasedOnTimemap(tm);

		return;
	}

	if(request.method == "displayUI"){
		if(debug){
			console.log(request.timegate);
			console.log(request.timemap);
			console.log(request.uri);
			console.log("-----");
		}
	}
	displayUIBasedOnContext();
});



function queryTimegate(tgURI){
	if(debug){console.log("Querying timegate at "+tgURI);}
	$.ajax({
		url: tgURI,
		type: "HEAD"
	}).done(function(data,textStatus,xhr,a,b){
		if(debug){console.log("Done querying timegate");}
		if(xhr.status == 200){
			console.log("xhr:");
			console.log(xhr);
			console.log("data:");
			console.log(data);
			console.log("textStatus");
			console.log(textStatus);
			console.log("xhr responseheaders");
			console.log(xhr.getAllResponseHeaders());
			var linkHeaderStr = xhr.getResponseHeader("Link");
			var tm = new Timemap(linkHeaderStr);
			console.log("We have the ultimate timemap");
			console.log("From the timegate: "+(tm.timegate ? "TimeGate, ":"")+(tm.timemap ? " TimeMap, ":"")+"and "+tm.mementos.length +" mementos");
			console.log(tm);
			if(tm.timemap){
				createTimemapFromURI(tm.timemap); //TODO prevent crawler trap/infinite querying
			}
			//console.log(tm.mementos);
		}else if(xhr.status == 302){
			console.log("Do something with 302 here");
		}
	});

}

function displayUIBasedOnTimemap(tm){
	if(tm.mementos.length > 0){
		logoInFocus = true; //stop rotating the logo, we have a list of mementos
		chrome.runtime.sendMessage({
			method: "notify",
			title: "TimeMap fetching complete.",
			body: tm.mementos.length+"+ mementos returned."
		}, function(response) {});
		displayMementoCountAtopLogo();

		var selectBox = "<select id=\"mdts\"><option>Select a Memento to view</option>";
		jsonizedMementos = "[";
		$(tm.mementos).each(function(i,m){
			selectBox += "\t<option value=\""+m.uri+"\">"+m.datetime+"</option>\r\n";
			jsonizedMementos += "{\"uri\": \""+m.uri+"\", \"datetime\": \""+m.datetime+"\"},";
		});
		selectBox += "</select>";
		jsonizedMementos = jsonizedMementos.slice(0,-1); //kill the last char (a comma)
		jsonizedMementos+= "]"; //make it valid JSON

		addInterfaceComponents(tm.mementos.length,1," timemaps",selectBox);
		$("#viewMementoButton").click(function(){viewDifferentMemento();});
		setMementoButtonInteractivityBasedOnMementoDropdown();
		//$("#countOverLogo").text(":)");//tm.mementos.length

	}
}

function createTimemapFromURI(uri,callback){
	$.ajax({
		url: uri,
		type: "GET" /* The payload is in the response body, not the head */
	}).done(function(data,textStatus,xhr){
		console.log("Done fetching Timemap from URI!");
		if(xhr.status == 200){
			//console.log(data);
			var tm = new Timemap(data);
			displayUIBasedOnTimemap(tm);

		}
	});
}

/**
 * TODO: update this old description since it is now a wrapper/router
 * Acquire all mementos from a timegate with either the current window URI
 *  or the URI of a value passed in
 * @param uri The target URI-R, if null then use window location
 * @param alreadyAcquiredTimemaps When function is called recursively, the
 *         previously acquired timemaps are passed in this argument
 * @param stopAtOneTimemap A boolean to specify whether additional pagination
 *         references should be followed and parsed before data is returned
 */
function getMementos(uri,alreadyAcquiredTimemaps,stopAtOneTimemap){
	if(debug){console.log("In getMementos");}
	chrome.storage.local.get(null,function(keys){
		if(isEmpty(keys)){ 	//no link headers in the request. :(
			if(debug){console.log("No URI accessed did not have an HTTP link header");}
			getMementosWithTimemap(uri,alreadyAcquiredTimemaps,stopAtOneTimemap);
		}else {				//we have link headers!
			if(keys.datetime){ //isA memento
				if(debug){console.log("We are a memento!");}
				logoInFocus = true;
				if(debug){console.log(keys);}
				//Display UI For When Browsing An Archive Page
				displayReturnToLiveWebButton(keys.original);
			}else if(keys.timemap){
				//prefer this, simply do a drop-in replacement from the previous implementation, which hit the aggregator
				if(debug){
					console.log("We have a timemap, let's do more! The timemap:");
					console.log(keys.timemap);
				}
				createTimemapFromURI(keys.timemap);
			}else if(keys.timegate){
				if(debug){
					console.log("We have a timegate URI, let's fetch it and try to get mementos or a timemap");
				}
				queryTimegate(keys.timegate);
				return;
			}else { // We had some link headers but none that were related to memento, so act as if we had no link header
				getMementosWithTimemap(uri,alreadyAcquiredTimemaps,stopAtOneTimemap);
			}
			//console.log("TODO, change the timegate/map to that which was specified in the link headers.");
		}
	});
}




function getMementosWithTimemap(uri,alreadyAcquiredTimemaps,stopAtOneTimemap,timemaploc){
	if(!timemaploc){ //use the aggregator
		timemaploc = aggregator_wdi_json + window.location;
	}

	if(uri){
		timemaploc = uri; //for recursive calls to this function, if a value is passed in, use it instead of the default, accommodates paginated timemaps
	}

	if(timemaploc.indexOf("https://") > -1){	//the target URI is secure and we can't have cross-scheme calls for JS
		//timemaploc = "https"+timemaploc.substr(4);
		console.log("in https conditional");
		chrome.runtime.sendMessage({
					method: "getMementosForHTTPSSource",
					value: timemaploc
		}, function(response) {});
		//Cannot use above callback, will usually not execute due to a race condition from chrome messaging and the subsequent Ajax call.

		return;

	}

	if(debug){console.log("About to fire off Ajax request for "+timemaploc);}
	$.ajax({
		url: timemaploc,
		type: "GET"
	}).done(function(data,textStatus,xhr){
		if(xhr.status == 200){
			console.log(data);
			var numberOfMementos = data.mementos ? data.mementos.list.length : 0;
			var numberOfTimeMaps = data.timemap_index ? data.timemap_index.length : 0;
			console.log(numberOfMementos + ' mementos, ' + numberOfTimeMaps + ' timemaps');
			if(numberOfMementos > 0) {
				revamp_createUIShowingMementosInTimeMap(data);
				displayUIBasedOnTimemap(data);
			}else if(numberOfTimeMaps > 0){
					console.log("Show indexed TimeMap interface here");
					revamp_countMementosInTimeMaps(data.timemap_index);
			}

			function revamp_createUIShowingMementosInTimeMap(tm){
				var selectBox = '<select id="mdts"><option>Select a Memento to view</option>';
				for(var m=0; m<tm.mementos.list.length; m++){
					selectBox += '\t<option value="' + tm.mementos.list[m].uri + '">' + tm.mementos.list[m].datetime + '</option>\r\n';
				}
				selectBox += '</select>';

				var numberOfTimeMaps = 1; // TODO: Looks to be an object an not an array, need example where multiple are defined
				addInterfaceComponents(tm.mementos.list.length,numberOfTimeMaps,"TimeMap",selectBox);
				displayMementoCountAtopLogo();
				$('#countOverLogo').text($('#countOverLogo').html());
				logoInFocus = true; // Stop spinning the logo

				$('#fetchAllMementosButton').click(function(){
						logoInFocus = false;
						flip();
					});
			}

			function fetchTimeMap(uri){
					var prom = new Promise(
						function(resolve, reject) {
							$.ajax({
								url: uri
							}).done(function(tmData){
								resolve(tmData);
							});
						}
					);
					return prom;
			}

			function revamp_countMementosInTimeMaps(tms){
					var totalNumberOfMementos = 0;
					var tmFetchPromises = [];
					for(var tm = 0; tm < tms.length; tm++){ // Generate Promises
						tmFetchPromises.push(fetchTimeMap(tms[tm].uri));
					}
					console.log('Fetching ' + tms.length + 'TimeMaps');
					Promise.all(tmFetchPromises).then(allTimeMapsFetched).catch(function(e) {
						console.log("A promise failed");
					});

					return;
			}

			function allTimeMapsFetched(arrayOfTimeMaps){
					console.log("Counting mementos for " + arrayOfTimeMaps.length + ' TimeMaps');
					var totalNumberOfMementos = 0;
					for(var tm = arrayOfTimeMaps.length - 1; tm >= 0; tm--){
						totalNumberOfMementos += arrayOfTimeMaps[tm].mementos.list.length;
					}
					console.log('Found ' + totalNumberOfMementos);
					addInterfaceComponents(totalNumberOfMementos,arrayOfTimeMaps.length,"TimeMaps","");
					displayMementoCountAtopLogo();
			}

/* TODO: tie the history manipulation into the revamp design
			$("#viewMementoButton").click(function(){
				addToHistory(window.location,$("#mdts option:selected").text(),null,//save the URI-R and Memento-Datetime of option chosen to localStorage
					function(){
						window.location = $("#mdts").val();
					}
				);

			});
*/

			$("#helpButton").click(function(){
				//alert("More information will be provided here about the recursive memento acquisition and parsing");
				window.open("http://matkelly.com/mink");
			});

			$("#archiveNow").click(function(){
				previousPanelHTML = $("#archiveOptions").html();
				$("#archiveOptions").html("");
				addArchiveNowButtons();
			});


			console.log("TODO: find out the number of mementos by not using this array length");
			if(false && dtMatches.length > 1002){
				//replace dropdown with a button to access a better UI is there are many mementos
				var dateUIButton = "<input type=\"button\" value=\"Select a Memento\" id=\"dateUIButton\" />";
				$( "#largeNumberOfMementoOption2" ).trigger( "click" );
				$( "#largeNumberOfMementoOption1" ).attr("disabled","disabled");
				//$("#mdts").after(dateUIButton);
				$("#mdts").fadeOut();
				$("#dateUIButton").click(displayDatepicker);
			}

			setMementoButtonInteractivityBasedOnMementoDropdown();

			//This is insufficient to making the Mink logo clickable on http://web.archive.org/web/20140115131022/http://www.yahoo.com/
			$("#mLogo").click(function(){
				showArchiveOptions();
			}); //if viewing an already archived page, for some reason this wasn't attached

			if(numberOfTimemaps > 1){
				chrome.runtime.sendMessage({
					method: "notify",
					title: "TimeMap fetching complete.",
					body: dtMatches.length+"+ mementos returned."
				}, function(response) {});
				$("#countOverLogo").text(dtMatches.length+"+");
			}

			//reset state variables
			logoInFocus = true;
			numberOfTimemaps = 1;
		}
		else if(xhr.status == 404){
			console.log("404 received");
			return;
		}
	}).fail(function(xhr,textStatus){
		console.log("ERROR");
		console.log(textStatus);
		console.log(xhr);
		if(xhr.status == 404){
			console.log("404");
			//return; //prevent infinite loop. This is probably not the correct way to handle it
		}

		//check if we're currently viewing an archive
		console.log("Are we viewing the archive? Basis 1: two http[s]*?://");

		var schemeOccurances = (window.location+"").match(/http[s]*:\/\//g);
		if(schemeOccurances.length > 1){ //we likely have two URIs in window.location
			console.log("  It appears we are viewing the archive based on multiple instances of http[s]*:// in window.location");
			// - Attempt to extract the URI-R
			var URI_M = (window.location+"").substr((window.location+"").indexOf("http",6)); //exclude the initial scheme, let's figure out where the URI-M starts
			URI_M = URI_M.replace("http://","http://"); //cross-protocol interaction is a no-no
			return getMementosWithTimemap(proxy + URI_M,null,true);
		}

		// hide the Memento logo
		hideLogo = true; logoInFocus = true;

		console.log(xhr);
	});
}

function Memento(uri,datetime){
	this.uri = uri;
	this.datetime = datetime;
}
