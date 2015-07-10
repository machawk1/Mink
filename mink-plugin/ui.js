var shrinking = true; // State variable to show whether the logo is currently shrinking in size
var logoInFocus = false; //used as a conditional for when to stop spinning the logo
var hideLogo = false;
var iconUrl = chrome.extension.getURL("images/icon128.png");
var iconUrlFlipped = chrome.extension.getURL("images/icon128flipped.png");
var previousPanelHTML = ""; //a means of saving the UI to revert to once in the archiveNow panel

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

function showArchiveOptions(){ //TODO: rename this function to say "toggle" instead of "show"
	if($("#archiveOptions").css("marginLeft") == "-700px"){ //draw is already open, close it
		$("#archiveOptions").animate({
			marginLeft: "0px",
			opacity: "0.0"
		},500,function(){
			if(previousPanelHTML != ""){ //revert to original UI
				$("#archiveOptions").html(previousPanelHTML);
				previousPanelHTML = "";
			}
		});

	}else { //open the drawer
		$("#archiveOptions").animate({
			marginLeft: "-700px",
			opacity: "1.0"
		},500,null);

		//RESTORE view button behavior
		setMementoButtonInteractivityBasedOnMementoDropdown(); //re-attach dropdown change to affect button state
		$("#viewMementoButton").attr("disabled","disabled"); //reset button state to disabled (default dropdown view)
		$("#viewMementoButton").click(function(){window.location = $("#mdts").val();}); //re-attach button functionality
	}
}

/**
 * After the query for the memento list via the URI's timemap, show a numerical count atop the logo
 */
function displayMementoCountAtopLogo(){
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
			"<button id=\"archiveNow_webcite\"     disabled=\"disabled\">WebCite</button>"+
			"<button id=\"archiveNow_permadotcc\"  disabled=\"disabled\">Perma.cc</button>"+
			"<button id=\"archiveNow_all\"         >All</button>"+
			//"<button id=\"archiveNow_org\"         >Other...</button>"+
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
				//console.log(archiveURI);
				$("#archiveNow_archivedotorg").attr("title",archiveURI);
				$(".archiveNowSuccess").click(function(){
					window.open($(this).attr("title"));
				});
			}else {
				//console.log(b);

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
			//console.log(a);
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
				//console.log(archiveURI);
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

	$("#archiveNow_all").click(function(){
		$("#archiveNow_archivedotorg").trigger("click");
		$("#archiveNow_archivedottoday").trigger("click");
		$(this).html("View All");
		$(this).addClass("archiveNowSuccess");
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
		$("#mLogo").css("opacity","1.0");
		if(hideLogo){
			$("#mLogo").attr("src",chrome.extension.getURL("images/icon128_error.png"));
			addArchiveNowButtons("0 mementos found. ");
			/*chrome.runtime.sendMessage({ //for #66, eventually turn this into a user option
					method: "notify",
					title: "Mink",
					body: "Page not found in the archives\r\nSelect exclamation icon to archive now!"
			}, function(response) {});*/
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

	var viewMementoButton = "<input type=\"button\" value=\"View\" id=\"viewMementoButton\" disabled=\"disabled\" />";

	var previousMementoDisabledValue = "";
	var nextMementoDisabledValue = "";
	var disabledValue = "disabled=\"disabled\"";

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
		yearList += "\t<li>"+Object.keys(yearbuckets)[key]+": "+yearbuckets[Object.keys(yearbuckets)[key]].length+"</li>\r\n";
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
     $("#tsv").text(tsv);


	doThatHighchartsThingYouDo();



	//$("body").append("<span id=\"csvdata\">"+csv+"</span>");
	//renderChart();
	//$("#datepickerContainer").css("bottom",$("#datepickerContainer").css("bottom")+$("#datepickerContainer").css("height"));
}




function addInterfaceComponents(nMementos,nTimemaps,tmVerbiage,select){
	var viewMementoButton = '<input type="button" value="View" id="viewMementoButton" disabled="disabled" />';
	var archiveNowButton = '<input type="button" value="Archive Now!" id="archiveNow" />';
	var helpButton = '<input type="button" value="?" id="helpButton" />';
  var LARGE_NUMBER_OF_MEMENTOS_THRESHOLD = 101;

	if(nMementos > LARGE_NUMBER_OF_MEMENTOS_THRESHOLD) { // 101 is a "a lot", don't show dropdown, only drilldown
		viewMementoButton = '';
	}

	$('#archiveOptions').html('<div id="largerNumberButtons"><p>List Mementos By:</p>' +
		'<button class="largeNumberOfMementoOption activeButton" id="largeNumberOfMementoOption1"><span>&#9673;</span>Dropdown</button>' +
		'<button class="largeNumberOfMementoOption" id="largeNumberOfMementoOption2"><span>&#9678;</span>Drill Down</button>' +
		'</div>' +
		'<div id="drilldownBox" style="display: none;"></div>' +
		'<span id="info">' +
			'<span id="numberOfMementos">' + nMementos + '</span> mementos available in ' +
			'<span id="timemapCount">' + nTimemaps + '</span> ' +
			'<span id="timemapPlurality">' + tmVerbiage + '</span>' +
		select +
		viewMementoButton +
		archiveNowButton +
		helpButton
	);

	if(nMementos > LARGE_NUMBER_OF_MEMENTOS_THRESHOLD) { // 101 is a "a lot", don't show dropdown, only drilldown
		setActiveButtonStyle('largeNumberOfMementoOption2');
	}


	$(".largeNumberOfMementoOption").click(function(){
		setActiveButtonStyle($(this).attr('id'));
	});

	function setActiveButtonStyle(bId){
		var activeButtonId = '#' + bId;
		$('.largeNumberOfMementoOption').removeClass("activeButton");
		$('.largeNumberOfMementoOption span').text("◎");
		$(activeButtonId + ' span').text("◉");
		$(activeButtonId).addClass('activeButton');

		if(activeButtonId == '#largeNumberOfMementoOption2'){showMementoCountsByYear();}
		else {destroyMementoCountsByYear();}
	}

}

function destroyMementoCountsByYear(){
	$("#drilldownBox").css("display","none");
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "test")
		 console.log("Received message!");
		else
		 console.log("some other method");
      //sendResponse({data: localStorage[request.key]});
    //else
  //    sendResponse({}); // snub them.
});

function showMementoCountsByYear(){
	chrome.storage.local.get('timemaps',
		function(localStore){
			if($("#drilldownBox").css("display") == "none" && $("#drilldownBox").html() != ""){
				$("#drilldownBox").css("display","block");
				return;
			}
			years = null;
			years = {};
			var yearDataFromLastIteration = "";

			function updateProgress(){ /* For debugging */
				console.clear();
				var yearData = "";
				for(var year in years){
					yearData += year + ': ' +years[year].length + '\n';
				}
				console.log(yearData)
				if(yearData == yearDataFromLastIteration) return;
				yearDataFromLastIteration = yearData;
				setTimeout(updateProgress,3000);
			}

			//setTimeout(updateProgress,3000);
			$(localStore.timemaps).each(function(tmI,tm){
				$(tm.mementos.list).each(function(mI,m){
					var dt = moment(m.datetime);
					if(!years[dt.year()]){years[dt.year()] = [];}
					years[dt.year()].push(m);
				})
			});


			var memCountList = "<ul id=\"years\">";
			for(var year in years){
				var mString = "mementos";
				if(years[year].length == 1){mString = mString.slice(0,-1);}
				memCountList += "<li>"+year+": "+years[year].length+" "+mString+"</li>\r\n"
			}

			memCountList += "</ul>";
			$("#drilldownBox").append(memCountList);
			$("#drilldownBox ul#years li").click(function(){
				$("#month,#day,#time").remove();
				$("#drilldownBox ul#years li").removeClass("selectedOption");
				$(this).addClass("selectedOption");
				showMementoCountsByMonths($(this).text().substr(0,$(this).text().indexOf(":")));
			});

			//adjust positional offset of year display box based on contents
			adjustDrilldownPositionalOffset();

			//ensure that the new display is visible (it won't be without this for few mementos)
			$("#drilldownBox").css("display","block");
	}); //end local.get(
};


function adjustDrilldownPositionalOffset(){
	var h = $("#drilldownBox").css("height").substr(0,$("#drilldownBox").css("height").indexOf("px"));
	$("#drilldownBox").css("top",((h*-1)-30)+"px");
}


var years = {};



//var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var monthNames = ["Jan ","Feb ","Mar ","Apr ","May ","June","July","Aug ","Sept ","Oct ","Nov ","Dec "];


function showMementoCountsByMonths(year){
	$("#months,#day,#time").remove();
	//console.log("showing mementos for months in "+year);
	var memCountList = "<ul id=\"months\">";
	var months = {}
	//console.log("X");
	//console.log(years[year]);
	for(memento in years[year]){

		var monthName = monthNames[moment(years[year][memento].datetime).month()];
		if(!months[monthName]){
			months[monthName] = [];
		}
		months[monthName].push(years[year][memento]);
	}

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

		showMementoCountsByDays(months[$(this).text().substr(0,$(this).text().indexOf(":"))]);
	});

	adjustDrilldownPositionalOffset();
}

function showMementoCountsByDays(mementos){
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
		window.location = $(this).attr("title");
		//console.log(days[$(this).text().substr(0,$(this).text().indexOf(":"))]);
	});

	adjustDrilldownPositionalOffset();
}
