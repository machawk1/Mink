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
 * After the query for the memento list via the URI's timemap, show a numerical count atop the logo
 */
function displayMementoCountAtopLogo(){
	//numberOfMementos
	var count = $("#numberOfMementos").text();
	$("#mLogo").after("<span id=\"countOverLogo\">"+count+"</span>");
	$("#countOverLogo").click(
		function(){
			showArchiveOptions();
		}
	);
	$("#countOverLogo").fadeIn();
}

/**
 * If no mementos are returned on a query to the archives, provide the buttons
 * that fire off a request to crawl the page to the archives
 */
function addArchiveNowButtons(addText){
	if(!addText){addText = "";}
	$("#archiveOptions").html(
			"<div id=\"archiveNowOptions\">"+
			addText + "Archive now? " +
			"<button id=\"archiveNow_archivedotorg\">Archive.org</button>"+
			"<button id=\"archiveNow_archivedottoday\">Archive.today</button>"+
			"<button id=\"archiveNow_webcite\"     >WebCite</button>"+
			"<button id=\"archiveNow_permadotcc\"  >Perma.cc</button>"+
			"<button id=\"archiveNow_all\"         >All</button>"+
			"<button id=\"archiveNow_org\"         >Other...</button>"+
			"</div>"
			
		);
	
	$("#archiveNow_archivedotorg").click(function(){
		$.ajax({
			method: 'GET',
			url: "https://web.archive.org/save/"+document.URL
		})
		.done(function(a,b,c){
			//console.log(a);
			if(b == "success"){
				chrome.runtime.sendMessage({
					method: "notify", 
					title: "Mink",
					body: "Archive.org Successfully Preserved page.\r\nSelect again to view."
				}, function(response) {});
				$("#archiveNow_archivedotorg").addClass("archiveNowSuccess");
				$("#archiveNow_archivedotorg").html("View on Archive.org");
				var parsedRawArchivedURI = a.match(/\"\/web\/.*\"/g);
				var archiveURI = "http://web.archive.org"+parsedRawArchivedURI[0].substring(1,parsedRawArchivedURI[0].length - 1);
				console.log(archiveURI);
				$("#archiveNow_archivedotorg").attr("title",archiveURI);
				$(".archiveNowSuccess").click(function(){
					window.open($(this).attr("title"));
				});
			}else {
				console.log(b);
				
			}
			//console.log(c);
		});
	});
	
	$("#archiveNow_archivedottoday").click(function(){
		$.ajax({
			method: 'POST',
			url: "http://archive.today/submit/",
			data: { coo: '', url: document.URL}
		})
		.done(function(a,b,c){
			console.log(a);
			if(b == "success"){
				chrome.runtime.sendMessage({
					method: "notify", 
					title: "Mink",
					body: "Archive.today Successfully Preserved page.\r\nSelect again to view."
				}, function(response) {});
				$("#archiveNow_archivedottoday").addClass("archiveNowSuccess");
				$("#archiveNow_archivedottoday").html("View on Archive.today");
				var parsedRawArchivedURI = a.match(/replace\(\"http:\/\/archive.today\/.*\"/g);
				var archiveURI = parsedRawArchivedURI[0].substring(9,parsedRawArchivedURI[0].length - 1);
				console.log(archiveURI);
				$("#archiveNow_archivedottoday").attr("title",archiveURI);
				$(".archiveNowSuccess").click(function(){
					window.open($(this).attr("title"));
				});
			}else {
				console.log(b);
				
			}
			//console.log(c);
		});
	});
	
}

/**
 * Animate the memento logo by modifying the image width on a timer until logoInFocus is set
 */
function flip(){
	$("#mLogo").fadeIn();
	$("#mLogo").css("opacity","0.5");
	var w = "0px";
	if(shrinking){w = "50px"; }
	
	if(logoInFocus && w == "0px" && $("#mLogo").attr("src") == iconUrl){
		console.log("Stopping the rotation on front of logo!");
		$("#mLogo").css("opacity","1.0");
		if(hideLogo){
			$("#mLogo").attr("src",chrome.extension.getURL("images/icon128_error.png")); 
			addArchiveNowButtons("0 mementos found. ");
			chrome.runtime.sendMessage({
					method: "notify", 
					title: "Mink",
					body: "Page not found in the archives\r\nSelect exclamation icon to archive now!"
			}, function(response) {});
		
			
			//$("#mLogo").fadeOut();
			//hideLogo = false;
		}else {
			displayMementoCountAtopLogo();
		}
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

function displayDatepicker(){
	if($("#datepickerContainer").length){return;} //to prevent multiple datepicker UIs from appearing
	
	$("body").append("<div id=\"datepickerContainer\"><div id=\"datepickerOptions\"></div></div>");
	
	var yearbuckets = [];
	var completeCSV = "year,month,datetime,uri,src";
	var tsv = "";
	$("#mdts option").each(function(i,v){
		if(i==0){return;} // The first entry in the list is not a date but a directive
		
		var mom = moment($(v).text());
		var year = mom.format("YYYY");
		var month = mom.format("MM");
		
		var host = $(v).val().match(/\/\/(.*?)\//g)[0].substr(2);
		
		if(yearbuckets[year]){ //a previous entry exists, append!
			yearbuckets[year].push(new Memento($(v).val(),$(v).text()));
		}else {
			yearbuckets[year] = [];
			yearbuckets[year].push(new Memento($(v).val(),$(v).text()));
		}
		
		tsv += year+" "+month+"\t"+$(v).val()+"\r\n";
	});
	
	var yearList = "<ul>\r\n";
	
	for(var key in Object.keys(yearbuckets)){
		console.log(Object.keys(yearbuckets)[key]+" has "+yearbuckets[Object.keys(yearbuckets)[key]].length+" mementos");
		console.log(Object.keys(yearbuckets)[key]+","+yearbuckets[Object.keys(yearbuckets)[key]].length);
		yearList += "\t<li>"+Object.keys(yearbuckets)[key]+": "+yearbuckets[Object.keys(yearbuckets)[key]].length+"</li>\r\n";
		//csv += "\r\n"+Object.keys(yearbuckets)[key]+","+yearbuckets[Object.keys(yearbuckets)[key]].length;
	}
	yearList += "</ul>";

	var daterangepicker = "<input type=\"text\" style=\"width: 300px\" name=\"reservation\" id=\"reservationtime\" class=\"form-control\" value=\"08/01/2013 1:00 PM - 08/01/2013 1:30 PM\"  class=\"span4\"/>";
	

	$("#datepickerOptions").append(daterangepicker);
	//$("#datepickerOptions").append(yearList);

	$('#reservationtime').daterangepicker({
		timePicker: true,
		format: 'MM/DD/YYYY h:mm A',
		timePickerIncrement: 1
	});
	

	
     $("#datepickerOptions").append(getHighchartsData());
     console.log(tsv);
     $("#tsv").text(tsv);
    
     
	doThatHighchartsThingYouDo();
     
        
    
	//$("body").append("<span id=\"csvdata\">"+csv+"</span>");
	//renderChart();
	//$("#datepickerContainer").css("bottom",$("#datepickerContainer").css("bottom")+$("#datepickerContainer").css("height"));
}