var shrinking = true; // State variable to show whether the logo is currently shrinking in size
var logoInFocus = false; //used as a conditional for when to stop spinning the logo
var hideLogo = false;
var iconUrl = chrome.extension.getURL("images/icon128.png"); 
var iconUrlFlipped = chrome.extension.getURL("images/icon128flipped.png"); 

function setMementoButtonInteractivityBasedOnMementoDropdown(){
	$("#mdts").change(function(){
		// If we're on the select box title or the original value, disable view button
		if($(this)[0].selectedIndex == 0 || $(this)[0].selectedIndex == $($(this)[0]).attr("alt")){
			$("#viewMementoButton").attr("disabled","disabled");
		}else {
			$("#viewMementoButton").removeAttr("disabled");
		}
	});
	
	$("#nextMementoButton").click(function(){viewDifferentMemento(1);});
	$("#prevMementoButton").click(function(){viewDifferentMemento(-1);});
}

function showArchiveOptions(){
	console.log("Showing archive options");
	$("#archiveOptions").animate({
		marginLeft: "-700px",
		opacity: "1.0"
	},500,null);
}

/**
 * Animate the memento logo by modifying the image width on a timer until logoInFocus is set
 */
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


/** Show mementos UI from JSON, logic similar to live web drop down display
 *  @param jsonStr A JSON string representative of memento objects, format defined within
 *  @param activeSelectionDatetime The current Memento-Datetime of the active memento, based on localStorage value
 *  @return String representative of the HTML UI elements to appear when viewing a memento
 */
function getMementosNavigationBasedOnJSON(jsonStr,activeSelectionDatetime){
	var mementoObjects = JSON.parse(jsonStr); // format: [{'uri':(uri),'datetime':(datetime),...]
	var dropdownOptions, selectedIndex = 0;
	$(mementoObjects).each(function(i,v){
		var selectedString = "";	//set which option is selected based on the select box text, NOT the value. Can probably be better done with selectors
		if($(v).attr("datetime") == activeSelectionDatetime){
			selectedString = "selected";
			selectedIndex = i;
		}
		
		dropdownOptions += "\t<option value=\""+$(v).attr("uri")+"\" "+selectedString+">"+$(v).attr("datetime")+"</option>\r\n";
	});
	var selectBox = "<select id=\"mdts\" alt=\""+(selectedIndex + 1)+"\"><option>Select a Memento to view</option>" +
					dropdownOptions +
					"</select>";
	delete mementoObjects; //garbage collection, probably not necessary but neither is coffee
	delete dropdownOptions;
	
	console.log("activeSelectioNDatetime = "+activeSelectionDatetime);
	
	var viewMementoButton = "<input type=\"button\" value=\"View\" id=\"viewMementoButton\" disabled=\"disabled\" />";
	
	var previousMementoDisabledValue = "";
	var nextMementoDisabledValue = "";
	var disabledValue = "disabled=\"disabled\"";
	
	console.log("si"+selectedIndex);
	if(selectedIndex == 0){previousMementoDisabledValue = disabledValue;}
	if(selectedIndex == mementoObjects.length -1){nextMementoDisabledValue = disabledValue;} 
	
	var previousMementoButton = "<input type=\"button\" value=\"&lt;&lt;prev\" id=\"prevMementoButton\" "+previousMementoDisabledValue+" />";
	var nextMementoButton = "<input type=\"button\" value=\"&gt;&gt;next\" id=\"nextMementoButton\" "+nextMementoDisabledValue+" />";
	
	
	
	return selectBox + viewMementoButton + previousMementoButton + nextMementoButton;
}





