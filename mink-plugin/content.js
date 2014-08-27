//PENDING, Issue #6, not possible w/o Chrome Canary: ar bootstrapCSS = chrome.extension.getURL("bootstrap/css/bootstrap.min.css");

var proxy = "http://mementoproxy.lanl.gov/aggr/timemap/link/1/";
var numberOfTimemaps = 0;

var embeddedTimemapRegex = /<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\"timemap\"/g;
var mementosURIsWithinTimemapsRegex = /<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\".*memento.*\"/g;
var mementosInTimemapBasedOnRelAttributeRegex = /;rel=\".*memento.*\"/g;
var datetimesInTimemapRegex = /datetime=\"(.*)\"/g;

//PENDING, Issue #6, not possible w/o Chrome Canary: $.scoped(); //allows the usage of bootstrap without affecting the target page's style

$("body").append("<div id=\"minkContainer\"></div>");
//PENDING, Issue #6, not possible w/o Chrome Canary: $("#minkContainer").append("<style scoped>\r\n@import url('"+bootstrapCSS+"');\r\n</style>");
$("#minkContainer").append("<div id=\"archiveOptions\"></div>");
$("#minkContainer").append("<img src=\""+iconUrl+"\" id=\"mLogo\" />");



setTimeout(flip,1000);

$(document).ready(function(){
	console.log("Document ready!");
	$("#mLogo").click(function(){
		showArchiveOptions();
	});
	
});

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
		}
	});
}

function displayUIBasedOnContext(){	
	chrome.runtime.sendMessage({method: "retrieve"}, function(response) {
		if(response == null || response.value == window.location || response.value == null){ // ON A LIVE WEB PAGE, FETCH MEMENTOS
			$("#archiveOptions").text("Fetching Mementos...");
			getMementos();
		}else if(response && response.value != null && 										//ON AN ARCHIVED PAGE, SHOW RETURN TO LIVE WEB BUTTON
				( ((window.location+"").indexOf(response.value) > -1) ||					//check if URI-R is in URI-M
				  ((window.location+"").replace("www.","").indexOf(response.value) > -1) ||	// 3 hacky attempts at removing the www to further accomplish this
				  ((window.location+"").indexOf(response.value.replace("www.","")) > -1) ||
				  ((window.location+"").replace("www.","").indexOf(response.value.replace("www.","")) > -1)
				) 																	// There were memento HTTP headers
			){ 
			console.log("Y"+window.location+" "+response.value);
			logoInFocus = true;
			
			//Display UI For When Browsing An Archive Page
			displayReturnToLiveWebButton();
			
			$("#archiveOptions").append(getMementosNavigationBasedOnJSON(response.mementos,response.memento_datetime));
			$("#viewMementoButton").click(viewDifferentMemento); //this is different from the live web context, as we don't store the URI-M in localStorage but instead, remember the URI-R there
		
			setMementoButtonInteractivityBasedOnMementoDropdown(); 		
		}else {
			console.log("There is no else, only if");
			//ugh, we don't want to be here, let's nuke the localStorage
			clearHistory(); 
			displayUIBasedOnContext();
		}
	  });
}

displayUIBasedOnContext();

/*
chrome.storage.local.get(null,function(keys){
	if(isEmpty(keys)){ 	//no link headers in the request. :(
		displayUIBasedOnContext();
	}else {				//we have link headers!
		console.log(keys);
		console.log("TODO, change the timegate/map to that which was specified in the link headers.");
	}
});*/

function isEmpty(o){ //returns if empty object is passed in
    for(var i in o){
        if(o.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
}


function displayReturnToLiveWebButton(){
		//Display UI For When Browsing An Archive Page
		$("#archiveOptions").html("<button id=\"liveWeb\">Return to Live Web</button>");
		$("#liveWeb").click(function(){window.location = response.value;});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log("in listener");
	if(request.method == "displayUI"){
		console.log(request.timegate);
		console.log(request.timemap);
		console.log(request.uri);
		console.log("-----");
	}
	displayUIBasedOnContext();
});


function queryTimeGateToGetTimeMap(tgURI){
	console.log(tgURI);
	console.log("X");
	$.ajax({
		url: tgURI,
		type: "HEAD"
	}).done(function(data,textStatus,xhr){
		if(xhr.status == 200){}
		console.log(xhr.status);
		console.log(xhr);
		console.log(xhr.getResponseHeader("Link"));
		console.log(data);
		console.log(textStatus);
	});
	
}

var jsonizedMementos = "[";

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
	console.log("In getMementos");
	chrome.storage.local.get(null,function(keys){
		if(isEmpty(keys)){ 	//no link headers in the request. :(
			console.log("No link header");
			getMementosWithTimemap(uri,alreadyAcquiredTimemaps,stopAtOneTimemap);
		}else {				//we have link headers!
			console.log(keys);
			if(keys.timemap){
				//prefer this, simply do a drop-in replacement from the previous implementation, which hit the aggregator
			}else if(keys.timegate){
				queryTimeGateToGetTimeMap(keys.timegate);
				return;
			}
			console.log("TODO, change the timegate/map to that which was specified in the link headers.");
		}
	});
}
	

function getMementosWithTimemap(uri,alreadyAcquiredTimemaps,stopAtOneTimemap,timemaploc){
	if(!timemaploc){ //use the aggregator
		timemaploc = proxy + window.location;
	}
	
	if(uri){
		timemaploc = uri; //for recursive calls to this function, if a value is passed in, use it instead of the default, accommodates paginated timemaps
	}
	
	console.log("About to fire off Ajax request for "+timemaploc);
	var jsonizedMementos = "[";
	$.ajax({
		url: timemaploc,
		type: "GET"
	}).done(function(data,textStatus,xhr){
		if(xhr.status == 200){
			//console.log(data);
			
			var othertimemaps = data.match(embeddedTimemapRegex);

			numberOfTimemaps++;
			if(uri && // URI passed in is a condition for pagination, else we'll assume the user just wants the first page
				othertimemaps && othertimemaps.length > 0 && 
				othertimemaps[0] != proxy + window.location && //the timemap contained references to other timemaps
				!stopAtOneTimemap //&&
				
				// ************ ARTIFICIAL LIMIT IMPOSED FOR TESTING
				//numberOfTimemaps < 4
				// ************ 
				){ 
					
				var timemapURI = othertimemaps[0].substring(1,othertimemaps[0].indexOf(">"));
				
				$("#timemapCount").text(numberOfTimemaps);
				console.log("Fetching timemap "+timemapURI);
				//should run a filter function here instead of naive equality
				if(!alreadyAcquiredTimemaps){
					return getMementosWithTimemap(timemapURI,data);
				}else {
					return getMementosWithTimemap(timemapURI,alreadyAcquiredTimemaps+data);
				}
			}else if(!alreadyAcquiredTimemaps){ //only the initial timemap exists
				alreadyAcquiredTimemaps = data;
				console.log("In elseif;");
			}else {
				console.log("in else");
			}
						
			var matches = alreadyAcquiredTimemaps.match(mementosURIsWithinTimemapsRegex);
			var relmatches = alreadyAcquiredTimemaps.match(mementosInTimemapBasedOnRelAttributeRegex);

			var dtMatches = alreadyAcquiredTimemaps.match(datetimesInTimemapRegex);

			var mementoURIs = [];
			$(matches).each(function(i,v){
				mementoURIs.push(v.substring(1,v.indexOf(">")));
			});
			
			console.log("rel matches count = "+relmatches.length+"    uris = "+mementoURIs.length); //these values should be the same, else there's a parsing problem
			//console.log(dtMatches);
			var selectBox = "<select id=\"mdts\"><option>Select a Memento to view</option>";
			
			
			
			var iaSrc = chrome.extension.getURL("images/archives/ia.png"); 
			
			$(dtMatches).each(function(i,v){
				var archiveImage = "";
				if(mementoURIs[i].indexOf("web.archive.org") > -1){
					archiveImage = "ia";
				}else if(mementoURIs[i].indexOf("archive-it.org") > -1){
					archiveImage = "ait";
				}else {
					archiveImage = "ice";
				}
				
				selectBox += "\t<option style=\"\" class=\""+archiveImage+"\" value=\""+mementoURIs[i]+"\">"+v.substring(10,dtMatches[0].length-1)+"</option>\r\n";
				jsonizedMementos += "{\"uri\": \""+mementoURIs[i]+"\", \"datetime\": \""+v.substring(10,dtMatches[0].length-1)+"\"},";
			});
			jsonizedMementos = jsonizedMementos.slice(0,-1); //kill the last char (a comma)
			jsonizedMementos+= "]"; //make it valid JSON
			
			selectBox += "</select>";
			var viewMementoButton = "<input type=\"button\" value=\"View\" id=\"viewMementoButton\" disabled=\"disabled\" />";
			var fetchMoreButton = "<span id=\"furtherFetchUI\"><input type=\"button\" value=\"Fetch All\" id=\"fetchAllMementosButton\" /><input type=\"button\" value=\"Archive Now!\" id=\"archiveNow\" /></span>";
			var helpButton = "<input type=\"button\" value=\"?\" id=\"helpButton\" />";
			
			var numberOfMementos = relmatches.length;
			if(othertimemaps){numberOfMementos += "+";}
			
			var correctTMPlural = "timemap";
			if(numberOfTimemaps > 1){correctTMPlural += "s";}
			$("#archiveOptions").html("<div id=\"largerNumberButtons\"><p>List Mementos By:</p>"+
				"<button class=\"largeNumberOfMementoOption activeButton\" id=\"largeNumberOfMementoOption1\"><span>&#9673;</span>Dropdown</button>"+
				"<button class=\"largeNumberOfMementoOption\" id=\"largeNumberOfMementoOption2\"><span>&#9678;</span>Drill Down</button>"+
				"<button class=\"largeNumberOfMementoOption\" id=\"largeNumberOfMementoOption3\"><span>&#9678;</span>Foo Method</button>"+
				"</div>"+
				"<div id=\"drilldownBox\"></div>" +
				"<span id=\"info\"><span id=\"numberOfMementos\">"+numberOfMementos+"</span> mementos available in <span id=\"timemapCount\">"+numberOfTimemaps+"</span> " + correctTMPlural + 
				selectBox +
				viewMementoButton +
				fetchMoreButton +
				helpButton
			);
			$(".largeNumberOfMementoOption").click(function(){
				var activeButtonId = "#"+$(this).attr("id");
				console.log(activeButtonId);
				$(".largeNumberOfMementoOption").removeClass("activeButton");
				$(".largeNumberOfMementoOption span").text("◎");
				$(activeButtonId+" span").text("◉");
				$(activeButtonId).addClass("activeButton");
				
				if(activeButtonId == "#largeNumberOfMementoOption2"){showMementoCountsByYear();}
				else {destroyMementoCountsByYear();}
			});

			
			function destroyMementoCountsByYear(){
				$("#drilldownBox").css("display","none");
			}
			
			var years = {};
			function showMementoCountsByYear(){
				if($("#drilldownBox").css("display") == "none"){ //if the expensive operation was done once, just resurrect the data from before
					$("#drilldownBox").css("display","block");
					return;
				}
				years = null;
				years = {};
				//console.log(jsonizedMementos);

				var mems;
				try {
					mems = JSON.parse(jsonizedMementos);
				}catch(e){
					console.log(e);
					//console.log(jsonizedMementos);
				}
				console.log(mems);
				
				$(mems).each(function(){ //exclude garbage option select values
					
					var dt = moment($(this)[0].datetime);

					if(!years[dt.year()]){years[dt.year()] = [];}
					//console.log($(this)[0]);
					years[dt.year()].push(new Memento($(this)[0].uri,$(this)[0].datetime));
				});
				

				//var millerJSONString = "[";
				var memCountList = "<ul id=\"years\">";
				for(var year in years){
					//console.log(years[year].length);
					//millerJSONString += "{\"id\":\""+year+"\", \"name\":\""+year+"\", \"parent\":false},";
					var mString = "mementos";
					if(years[year].length == 1){mString = mString.slice(0,-1);}
					memCountList += "<li>"+year+": "+years[year].length+" "+mString+"</li>\r\n"
					//$("#drilldownBox").append("<li>"+year+": "+years[year].length+" mementos</li>");
				}
				//millerJSONString = millerJSONString.slice(0,-1)+"]";
				memCountList += "</ul>";
				$("#drilldownBox").append(memCountList);
				$("#drilldownBox ul#years li").click(function(){
					$("#month,#day,#time").remove();
					$("#drilldownBox ul#years li").removeClass("selectedOption");
					$(this).addClass("selectedOption");
					showMementoCountsByMonths($(this).text().substr(0,$(this).text().indexOf(":")));
				});
				//console.log(millerJSONString);
				//console.log(jsonizedMementos);
				/*$("#drilldownBox").miller({
					url: function(id){
						//return JSON.parse(millerJSONString);
						var lns = JSON.parse(millerJSONString);
						data = lns[0]['parent'];
					}	
				});*/
				
				
				//adjust positional offset of year display box based on contents
				adjustDrilldownPositionalOffset();
			};
			
			function adjustDrilldownPositionalOffset(){
				var h = $("#drilldownBox").css("height").substr(0,$("#drilldownBox").css("height").indexOf("px"));
				$("#drilldownBox").css("top",((h*-1)-30)+"px");
			}
			
			var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
			
			function showMementoCountsByMonths(year){
				$("#months,#day,#time").remove();
				console.log("showing mementos for months in "+year);
				var memCountList = "<ul id=\"months\">";
				var months = {}
				for(memento in years[year]){
					var monthName = monthNames[moment(years[year][memento].datetime).month()];
					if(!months[monthName]){
						months[monthName] = [];
					}
					months[monthName].push(years[year][memento]);
				}
				console.log(months);
				for(month in months){
					var mString = "mementos";
					if(months[month].length == 1){mString = mString.slice(0,-1);}
					memCountList += "<li>"+month+": "+months[month].length+" "+mString+"</li>\r\n";
				}
				
				memCountList += "</ul>";
				$("#drilldownBox").append(memCountList);	
				
				$("#drilldownBox ul#months li").click(function(){
					$("#day,#time").remove();
					$("#drilldownBox ul#months li").removeClass("selectedOption");
					$(this).addClass("selectedOption");
					console.log($(this).text().substr(0,$(this).text().indexOf(":")));
					showMementoCountsByDays(months[$(this).text().substr(0,$(this).text().indexOf(":"))]);
				});
				
				adjustDrilldownPositionalOffset();		
			}
			
			function showMementoCountsByDays(mementos){
				console.log(mementos);
				var days = {};
				var dayNames = ["NA","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th",
								"11th","12th","13th","14th","15th","16th","17th","18th","19th","20th",
								"21st","22nd","23rd","24th","25th","26th","27th","28th","29th","30th","31st"];
				
				for(memento in mementos){
					var dayNumber = dayNames[moment(mementos[memento].datetime).date()];
					if(!days[dayNumber]){
						days[dayNumber] = [];
					}
					days[dayNumber].push(mementos[memento]);
				}
				var memCountList = "<ul id=\"day\">";
				for(day in days){
					var mString = "mementos";
					if(days[day].length == 1){mString = mString.slice(0,-1);}
					memCountList += "<li>"+day+": "+days[day].length+" "+mString+"</li>\r\n";
				}
				
				memCountList += "</ul>";
				$("#drilldownBox").append(memCountList);
				$("#drilldownBox ul#day li").click(function(){
					$("#time").remove();
					$("#drilldownBox ul#day li").removeClass("selectedOption");
					$(this).addClass("selectedOption");

					showMementoCountsByTime(days[$(this).text().substr(0,$(this).text().indexOf(":"))]);
				});
				
				adjustDrilldownPositionalOffset();		
			}

			function showMementoCountsByTime(mementos){
				var times = {};
				var uris = {};
				for(memento in mementos){
					var mom = moment(mementos[memento].datetime);
					var time = mom.format("HH:mm:ss:SSS");
					
					console.log(mementos[memento]);
					if(!times[time]){
						times[time] = [];
						uris[time] = [];
					}
					times[time].push(mementos[memento]);
					uris[time] = mementos[memento].uri;
				}
				var memCountList = "<ul id=\"time\">";
				for(time in times){
					var mString = "mementos";
					if(times[time].length == 1){mString = mString.slice(0,-1);}
					memCountList += "<li title=\""+uris[time]+"\">"+time+"</li>\r\n";//: "+times[time].length+" "+mString+"</li>\r\n";
				}
				
				memCountList += "</ul>";
				$("#drilldownBox").append(memCountList);
				$("#drilldownBox ul#time li").click(function(){
					console.log($(this).attr("title"));
					window.location = $(this).attr("title");
					//console.log(days[$(this).text().substr(0,$(this).text().indexOf(":"))]);
				});
				
				adjustDrilldownPositionalOffset();	
			}			
			
			
			$("#fetchAllMementosButton").click(function(){logoInFocus = false; flip(); getMementosWithTimemap(proxy + window.location,data);});
			if(!othertimemaps){$("#fetchAllMementosButton").attr("disabled","disabled");}
			
			$("#viewMementoButton").click(function(){
				addToHistory(window.location,$("#mdts option:selected").text(),null,//save the URI-R and Memento-Datetime of option chosen to localStorage
					function(){
						window.location = $("#mdts").val();
					}
				); 
				
			});
			
			$("#helpButton").click(function(){
				alert("More information will be provided here about the recursive memento acquisition and parsing");
			});
			
			$("#archiveNow").click(function(){
				$("#archiveOptions").html("");
				addArchiveNowButtons();
			});
			
			if(dtMatches.length > 1002){
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
			$("#mLogo").click(function(){showArchiveOptions();}); //if viewing an already archived page, for some reason this wasn't attached
			
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
	}).error(function(e){
		console.log("ERROR");

		if(e.status == 404){
			return; //prevent infinite loop. This is probably not the correct way to handle it
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
		
		console.log(e);
	});
}

function Memento(uri,datetime){
	this.uri = uri;
	this.datetime = datetime;
}

