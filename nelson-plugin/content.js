//alert($("body").html());
var iconUrl = chrome.extension.getURL("images/icon128.png"); 
var iconUrlFlipped = chrome.extension.getURL("images/icon128flipped.png"); 

$("body").append("<div id=\"nelsonContainer\"></div>");
$("#nelsonContainer").append("<div id=\"archiveOptions\">test</div>");
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
		showArchiveOptions();
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
		logoInFocus = true;
	});
});

function showArchiveOptions(){
	$("#archiveOptions").animate({
		marginLeft: "-500px",
		opacity: "1.0"
	},500,null);
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