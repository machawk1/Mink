//alert($("body").html());
var iconUrl = chrome.extension.getURL("images/icon128.png"); 
var iconUrlFlipped = chrome.extension.getURL("images/icon128flipped.png"); 
//PENDING, Issue #6, not possible w/o Chrome Canary: ar bootstrapCSS = chrome.extension.getURL("bootstrap/css/bootstrap.min.css");

var proxy = "http://mementoproxy.lanl.gov/aggr/timemap/link/1/";
var numberOfTimemaps = 0;

var embeddedTimemapRegex = /<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\"timemap\"/g;
var mementosURIsWithinTimemapsRegex = /<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\".*memento.*\"/g;
var mementosInTimemapBasedOnRelAttributeRegex = /;rel=\".*memento.*\"/g;
var datetimesInTimemapRegex = /datetime=\"(.*)\"/g;

//PENDING, Issue #6, not possible w/o Chrome Canary: $.scoped(); //allows the usage of bootstrap without affecting the target page's style

$("body").append("<div id=\"nelsonContainer\"></div>");
//PENDING, Issue #6, not possible w/o Chrome Canary: $("#nelsonContainer").append("<style scoped>\r\n@import url('"+bootstrapCSS+"');\r\n</style>");
$("#nelsonContainer").append("<div id=\"archiveOptions\"></div>");
$("#nelsonContainer").append("<img src=\""+iconUrl+"\" id=\"mLogo\" />");


var shrinking = true;
var logoInFocus = false; //used as a conditional for when to stop spinning the logo
var hideLogo = false;
setTimeout(flip,1000);

function flip(){
	$("#mLogo").fadeIn();
	var w = "0px";
	if(shrinking){w = "50px"; }
	
	if(logoInFocus && w == "0px" && $("#mLogo").attr("src") == iconUrl){
		console.log("Stopping the rotation on front of logo!");
		if(hideLogo){$("#mLogo").fadeOut();hideLogo = false;}
		return;
	}
	
	shrinking = !shrinking;
	$("#mLogo").animate({
		width: w,
		height: "50px"
	},800,
		function(){
			if($("#mLogo").css("width") == "0px"){
				if($("#mLogo").attr("src") == iconUrl){
					$("#mLogo").attr("src",iconUrlFlipped);
				}else {
					$("#mLogo").attr("src",iconUrl);
				}
			}
			flip();
		}
	);
}

$(document).ready(function(){
	$("#mLogo").click(function(){
		showArchiveOptions();
		//logoInFocus = true;
	});
});

function showArchiveOptions(){
	$("#archiveOptions").animate({
		marginLeft: "-600px",
		opacity: "1.0"
	},500,null);
}

function addToHistory(uri_r,memento_datetime,mementos){
	var mementosToStore = mementos;
	if(!mementosToStore){mementosToStore = jsonizedMementos;}
	chrome.runtime.sendMessage({method: "store", value: ""+uri_r, memento_datetime: memento_datetime, mementos: mementosToStore}, function(response) {});
}

function clearHistory(){
	chrome.runtime.sendMessage({method: "nukeFromOrbit", value: "It's the only way to be sure"}, function(response) {});
}

function setViewMementoButtonInteractivityBasedOnMementoDropdown(){
	$("#mdts").change(function(){
		if($(this)[0].selectedIndex == 0){
			$("#viewMementoButton").attr("disabled","disabled");
		}else {
			$("#viewMementoButton").removeAttr("disabled");
		}
	});
}

// - show mementos UI from JSON, logic similar to live web drop down display
function getDropdownOfMementosBasedOnJSON(jsonStr,activeSelectionDatetime){
	var mementoObjects = JSON.parse(jsonStr); // format: [{'uri':(uri),'datetime':(datetime),...]
	var selectBox = "<select id=\"mdts\"><option>Select a Memento to view</option>";
	$(mementoObjects).each(function(i,v){
		var selectedString = "";	//set which option is selected based on the select box text, NOT the value. Can probably be better done with selectors
		if($(v).attr("datetime") == activeSelectionDatetime){selectedString = "selected";}
		
		selectBox += "\t<option value=\""+$(v).attr("uri")+"\" "+selectedString+">"+$(v).attr("datetime")+"</option>\r\n";
	});
	selectBox += "</select>";
	delete mementoObjects; //garbage collection, probably not necessary but neither is coffee
	
	console.log("activeSelectioNDatetime = "+activeSelectionDatetime);
	//$("#mdts option[value='"+activeSelectionDatetime+"']").attr("selected", "selected");
	var viewMementoButton = "<input type=\"button\" value=\"View\" id=\"viewMementoButton\" disabled=\"disabled\" />";
	return selectBox + viewMementoButton;
}

function displayUIBasedOnContext(){
	chrome.runtime.sendMessage({method: "retrieve"}, function(response) {
		if(response == null || response.value == window.location || response.value == null){ // ON A LIVE WEB PAGE, FETCH MEMENTOS
			console.log("XZ");
			$("#archiveOptions").text("Fetching Mementos...");
			getMementos();
		}else if(response && response.value != null && 										//ON AN ARCHIVED PAGE, SHOW RETURN TO LIVE WEB BUTTON
				( ((window.location+"").indexOf(response.value) > -1) ||					//check if URI-R is in URI-M
				  ((window.location+"").replace("www.","").indexOf(response.value) > -1) ||	// 3 hacky attempts at removing the www to further accomplish this
				  ((window.location+"").indexOf(response.value.replace("www.","")) > -1) ||
				  ((window.location+"").replace("www.","").indexOf(response.value.replace("www.","")) > -1)
				)
			){ 
			console.log("Y"+window.location+" "+response.value);
			logoInFocus = true;
			
			//Display UI For When Browsing An Archive Page
			$("#archiveOptions").html("<button id=\"liveWeb\">Return to Live Web</button>");
			$("#liveWeb").click(function(){window.location = response.value;});
			
			$("#archiveOptions").append(getDropdownOfMementosBasedOnJSON(response.mementos,response.memento_datetime));
			$("#viewMementoButton").click(function(){ //this is different from the live web context, as we don't store the URI-M in localStorage but instead, remember the URI-R there
				addToHistory(response.value,$("#mdts option:selected").text(),response.mementos); //Save the Memento-Datetime of option chosen to localStorage

				window.location = $("#mdts").val();dfgdf
			});
			setViewMementoButtonInteractivityBasedOnMementoDropdown(); 			
		}else {
			console.log("There is no else, only if");
			//ugh, we don't want to be here, let's nuke the localStorage
			clearHistory(); 
			displayUIBasedOnContext();
		}
	  });
}
displayUIBasedOnContext();
//});
var jsonizedMementos = "[";

function getMementos(uri,alreadyAcquiredTimemaps){
	var timemaploc = proxy + window.location;
	if(uri){
		timemaploc = uri; //for recursive calls to this function, if a value is passed in, use it instead of the default, accommodates paginated timemaps
	}
	
	console.log("About to fire off Ajax request for "+timemaploc);
	$.ajax({
		url: timemaploc,
		type: "GET"
	}).done(function(data,textStatus,xhr){
		if(xhr.status == 200){
			console.log(data);
			
			var othertimemaps = data.match(embeddedTimemapRegex);
			numberOfTimemaps++;
			if(uri && // URI passed in is a condition for pagination, else we'll assume the user just wants the first page
				othertimemaps && othertimemaps.length > 0 && othertimemaps[0] != proxy + window.location){ //the timemap contained references to other timemaps
				var timemapURI = othertimemaps[0].substring(1,othertimemaps[0].indexOf(">"));
				
				$("#timemapCount").text(numberOfTimemaps);
				console.log("Fetching timemap "+timemapURI);
				//should run a filter function here instead of naive equality
				if(!alreadyAcquiredTimemaps){
					return getMementos(timemapURI,data);
				}else {
					return getMementos(timemapURI,alreadyAcquiredTimemaps+data);
				}
			}else if(!alreadyAcquiredTimemaps){ //only the initial timemap exists
				alreadyAcquiredTimemaps = data;
			}
						
			var matches = alreadyAcquiredTimemaps.match(mementosURIsWithinTimemapsRegex);
			var relmatches = alreadyAcquiredTimemaps.match(mementosInTimemapBasedOnRelAttributeRegex);

			var dtMatches = alreadyAcquiredTimemaps.match(datetimesInTimemapRegex);

			var mementoURIs = [];
			$(matches).each(function(i,v){
				mementoURIs.push(v.substring(1,v.indexOf(">")));
			});
			
			console.log("rel matches count = "+relmatches.length+"    uris = "+mementoURIs.length); //these values should be the same, else there's a parsing problem
			var selectBox = "<select id=\"mdts\"><option>Select a Memento to view</option>";

			$(dtMatches).each(function(i,v){
				selectBox += "\t<option value=\""+mementoURIs[i]+"\">"+v.substring(10,dtMatches[0].length-1)+"</option>\r\n";
				jsonizedMementos += "{\"uri\": \""+mementoURIs[i]+"\", \"datetime\": \""+v.substring(10,dtMatches[0].length-1)+"\"},";
			});
			jsonizedMementos = jsonizedMementos.slice(0,-1); //kill the last char (a comma)
			jsonizedMementos+= "]"; //make it valid JSON
			
			selectBox += "</select>";
			var viewMementoButton = "<input type=\"button\" value=\"View\" id=\"viewMementoButton\" disabled=\"disabled\" />";
			var fetchMoreButton = "<input type=\"button\" value=\"Fetch All\" id=\"fetchAllMementosButton\" />";
			var helpButton = "<input type=\"button\" value=\"?\" id=\"helpButton\" />";
			
			var numberOfMementos = relmatches.length;
			if(othertimemaps){numberOfMementos += "+";}
			
			$("#archiveOptions").html("<span id=\"info\">"+numberOfMementos+" mementos available in <span id=\"timemapCount\">"+numberOfTimemaps+"</span> timemaps" + 
				selectBox +
				viewMementoButton +
				fetchMoreButton +
				helpButton
			);
			$("#fetchAllMementosButton").click(function(){logoInFocus = false; flip(); getMementos(proxy + window.location);});
			if(!othertimemaps){$("#fetchAllMementosButton").attr("disabled","disabled");}
			
			$("#viewMementoButton").click(function(){
				addToHistory(window.location,$("#mdts option:selected").text()); //save the URI-R and Memento-Datetime of option chosen to localStorage
				window.location = $("#mdts").val();
			});
			
			$("#helpButton").click(function(){
				alert("More information will be provided here about the recursive memento acquisition and parsing");
			});
			setViewMementoButtonInteractivityBasedOnMementoDropdown();
			
			logoInFocus = true;
			numberOfTimemaps = 1;
		}
	}).error(function(e){
		console.log("ERROR");
		
		//check if we're currently viewing an archive
		
		// hide the Memento logo
		hideLogo = true; logoInFocus = true;
		console.log(e);
	});
}



