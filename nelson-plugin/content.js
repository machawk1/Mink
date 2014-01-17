//alert($("body").html());
var iconUrl = chrome.extension.getURL("images/icon128.png"); 
var iconUrlFlipped = chrome.extension.getURL("images/icon128flipped.png"); 
var proxy = "http://mementoproxy.lanl.gov/aggr/timemap/link/1/";

$("body").append("<div id=\"nelsonContainer\"></div>");
$("#nelsonContainer").append("<div id=\"archiveOptions\">Fetching Mementos...</div>");
$("#nelsonContainer").append("<img src=\""+iconUrl+"\" id=\"mLogo\" />");


var shrinking = true;
var logoInFocus = false;
setTimeout(flip,1000);

function flip(){
	$("#mLogo").fadeIn();
	var w = "0px";
	if(shrinking){w = "50px"; }
	
	if(logoInFocus && w == "0px" && $("#mLogo").attr("src") == iconUrl){
		console.log("Stopping the rotation on front of logo!");
		
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
		marginLeft: "-500px",
		opacity: "1.0"
	},500,null);
}
echoCurrentURI();
function echoCurrentURI(uri,alreadyAcquiredTimemaps){
	console.log("Fetching current");
	var timemaploc = proxy + window.location;
	if(uri){
		timemaploc = uri;
	}
	$.ajax({
		url: timemaploc,
		type: "GET"
	}).done(function(data,textStatus,xhr){
		//console.log("SUCCESS!");
		console.log(data);
		//console.log(textStatus);
		//console.log(xhr);
		if(xhr.status == 200){
			var othertimemaps = data.match(/<https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)>;rel=\"timemap\"/g);

			if(othertimemaps && othertimemaps.length > 0 && othertimemaps[0] != proxy + window.location){ //the timemap contained references to other timemaps
				var timemapURI = othertimemaps[0].substring(1,othertimemaps[0].indexOf(">"));
				
				
				console.log("Going to timemap "+timemapURI);
				//should run a filter function here instead of naive equality
				if(!alreadyAcquiredTimemaps){
					return echoCurrentURI(timemapURI,data);
				}else {
					return echoCurrentURI(timemapURI,alreadyAcquiredTimemaps+data);
				}
			}else if(!uri && !alreadyAcquiredTimemaps){ //only the initial timemap exists
				alreadyAcquiredTimemaps = data;
			}
			
			var matches = alreadyAcquiredTimemaps.match(/rel=\".*memento.*\"/g);
			var dtMatches = alreadyAcquiredTimemaps.match(/datetime=\"(.*)\"/g);

			var selectBox = "<select id=\"mdts\">";
			$(dtMatches).each(function(i,v){
				selectBox += "\t<option>"+v.substring(10,dtMatches[0].length-1)+"</option>\r\n";
			});
			selectBox += "</select>";
			
			$("#archiveOptions").html(matches.length+" mementos available." +
				selectBox
			);
			logoInFocus = true;
		}
	}).error(function(e){
		console.log("ERROR");
		console.log(e);
	});
	//console.log("X"+window.location);
}

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
       /* if(request.method == "getText"){
            sendResponse({data: document.all[0].innerText, method: "getText"}); //same as innerText
        }
        
        if(request.method == "forwardTo"){
        	window.location = request.forwardToUrl;
        }*/
    }
);