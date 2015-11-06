var MAX_MEMENTOS_IN_DROPDOWN = 500;

function createShadowDOM() {
   var selector = '#minkuiX';
   
   var shadow = document.querySelector('#minkWrapper').createShadowRoot();
   var template = document.querySelector(selector);
   //var clone = document.importNode(template, true);
   shadow.appendChild(template);
   
   setupDrilldownInteractions();
}

function setupDrilldownInteractions() {
  setupDrilldownInteraction_Year();
}


function appendHTMLToShadowDOM() {
 $.ajax(chrome.extension.getURL('minkui.html'))
 .done(function(data) {
   console.log('TODO: before invoking any further, check to verify that some mementos exist (the aggregator query has returned).');
   
   $('body').append(data);
   
   var mementos = tmData.mementos.list; //e.g. mementos[15].uri and mementos[15].datetime
   
   if(mementos.length > MAX_MEMENTOS_IN_DROPDOWN) {
     // TODO: call Miller column builder here
     console.log('TODO: call Miller column builder here, there are too many mementos for a dropdown');
     $('.dropdown').hide();
     buildDrilldown();
   }else if(mementos.length === 0) {
     switchToArchiveNowInterface();     
   }else {
     buildDropDown(mementos);
     buildDrilldown_Year(mementos);
   }
   
   $('#mementosAvailable span').html(mementos.length);
   appendCSSToShadowDOM();
  });
}

function addZ(n){
   return n<10? '0'+n:''+n;
}

function buildBreadcrumbs(mementos) {
   var years = {};

   for(var m = 0; m < mementos.length; m++) { 
       console.log(m);  
	   var dr = Date.parse(mementos[0].datetime);
	   var dt = new Date(dr);
	   var year = addZ(dt.getFullYear());
	   var month = addZ(dt.getMonth() + 1);
	   var day = addZ(dt.getDate());
   
	   var hr = addZ(dt.getHours());
	   var min = addZ(dt.getMinutes());
	   var sec = addZ(dt.getSeconds());
	   
	   var time = hr + ':' + min + ':' + sec;
   

       if(!(year in years)) {
          years.year = {};
       }
       if(!(month in years.year)) {
          years.year.month = {};
       }
       if(!(day in years.year.month)) {
          years.year.month.day = [];
       }
       
       years.year.month.day.push(time);
   }
   console.log(years);
}

function buildDropDown(mementos) {
   var mementoSelections = '';
   for(var mm = 0; mm < mementos.length; mm++) {
     mementoSelections += '<option data-uri="' + mementos[mm].uri + '" data-datetime="'+ mementos[mm].datetime + '">' + mementos[mm].datetime + '</option>';
   }

   $('#mementosDropdown').append(mementoSelections);
}

function switchToArchiveNowInterface() {
  $('#mementosDropdown').addClass('noMementos');
  $('#viewMementoButton').addClass('noMementos');
  $('#minkStatus #steps').addClass('noMementos');
  $('#archiveNow').addClass('noMementos');
  $('.archiveNowInterface').removeClass('hidden');  
}
 
function appendCSSToShadowDOM() {
  $.ajax(chrome.extension.getURL('css/minkui.css'))
   .done(function(data) {
    var styleElement = '<style type="text/css">\n' + data + '\n</style>\n';  
    $('#minkuiX').append(styleElement);
    createShadowDOM();
  });
}

function archiveURI_archiveOrg(cb) {
	$.ajax({
		method: 'GET',
		url: 'https://web.archive.org/save/' + document.URL
	})
	.done(function(a,b,c){
		if(b == 'success'){
			chrome.runtime.sendMessage({
				method: 'notify',
				title: 'Mink',
				body: 'Archive.org Successfully Preserved page.\r\nSelect again to view.'
			}, function(response) {});
			cb();
			
			
			$('#archivelogo_ia').addClass('archiveNowSuccess');
			$('#archiveNow_archivedotorg').html('View on Archive.org');
			var parsedRawArchivedURI = a.match(/\"\/web\/.*\"/g);
			var archiveURI = 'http://web.archive.org' + parsedRawArchivedURI[0].substring(1,parsedRawArchivedURI[0].length - 1);
			//console.log(archiveURI);
			$('#archiveNow_archivedotorg').attr('title', archiveURI);
			$('.archiveNowSuccess').click(function(){
				window.open($(this).attr('title'));
			});

			refreshAggregatorsTimeMap(document.URL);
		}
	});
}

function archiveURI_archiveDotIs() {
	$.ajax({
		method: 'POST',
		url: 'http://archive.is/submit/',
		data: { coo: '', url: document.URL}
	})
	.done(function(a,b,c){
		//console.log(a);
		if(b == 'success'){
			chrome.runtime.sendMessage({
				method: 'notify',
				title: 'Mink',
				body: 'Archive.is Successfully Preserved page.\r\nSelect again to view.'
			}, function(response) {});
			$('#archiveNow_archivedotis').addClass('archiveNowSuccess');
			$('#archiveNow_archivedotis').html('View on Archive.is');

			var linkHeader = c.getResponseHeader('link');
			var tmFromLinkHeader = new Timemap(linkHeader);
			var archiveURI = tmFromLinkHeader.mementos[tmFromLinkHeader.mementos.length - 1].uri;

			$('#archiveNow_archivedotis').attr('title', archiveURI);
			$('.archiveNowSuccess').click(function(){
				window.open($(this).attr('title'));
			});

			refreshAggregatorsTimeMap(document.URL);
		}else {
			console.log(b);

		}
		//console.log(c);
	});
}

function archiveURI_allServices() {
	$('#archiveNow_all').click(function(){
		$('#archiveNow_archivedotorg').trigger('click');
		$('#archiveNow_archivedotis').trigger('click');
		$(this).html('View All');
		$(this).addClass('archiveNowSuccess');
	});
}



/* ********************* */

var years = {};
var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildDrilldown_Year(mementos){
// NOTE: Shadow DOM not yet built. Do so after this function

	years = null;
	years = {};
	var yearDataFromLastIteration = '';

	$(mementos).each(function(mI,m){
		var dt = moment(m.datetime);
		if(!years[dt.year()]){years[dt.year()] = [];}
		years[dt.year()].push(m);
	})

	var memCountList = '<ul id="years">';
	for(var year in years){
		memCountList += '<li data-year="' + year + '">' + year + '<span class="memCount">' + years[year].length + '</span></li>\r\n';
	}

	memCountList += '</ul>';

    var drilldown = document.getElementById('drilldownBox');
	$('body #drilldownBox').append(memCountList);
}

function setupDrilldownInteraction_Year() {
    var mementos = tmData.mementos.list;
    console.log('setting up...');
    var shadow = document.getElementById('minkWrapper').shadowRoot;

    var yearsNode = shadow.getElementById('years');
    console.log(yearsNode);
    var years = shadow.getElementById('years').childNodes;
    console.log(years.length);
    for(var year=0; year<years.length; year++) {
      console.log(years[year]);
      years[year].onclick = function(event){
      	buildDrilldown_Month($(this).data('year'));
      };
    }
 } 
  /*	  
 
	//$('body /deep/ #month,body /deep/ #day,body /deep/ #time').remove();
		$('body /deep/ #drilldownBox ul#years li').removeClass('selectedOption');
		$(this).addClass('selectedOption');
		showMementoCountsByMonths($(this).data('year'));
		if(debug) { 
		  console.log('coverage test 9943'); console.log($(this).data('year'));
		}
	});*/

	//adjustDrilldownPositionalOffset();



function buildDrilldown_Month(year){
    var mementos = tmData.mementos.list;
	var memCountList = '<ul id="months">';
	var months = {}


	for(memento in year){

		var monthName = monthNames[moment(year[memento].datetime).month()];
		if(!months[monthName]){
			months[monthName] = [];
		}
		months[monthName].push(year[memento]);
	}

	for(month in months){
		memCountList += '<li data-month="' + month + '">' + month + '<span class="memCount">' + months[month].length + '</span></li>\r\n';
	}

	memCountList += '</ul>';
    
    var parser = new DOMParser();
    var monthNodes = parser.parseFromString(memCountList, "text/xml");
    
    var drilldown = document.getElementById('drilldownBox');
    var shadow = document.getElementById('minkWrapper').shadowRoot;
    shadow.getElementById('drilldownBox').appendChild(monthNodes);
    
    //TODO: setup onclick here
}





function showMementoCountsByMonths(year){
/*
	$('body /deep/ #months,body /deep/ #day,body /deep/ #time').remove();

console.log('testX');

	var memCountList = '<ul id="months">';
	var months = {}


	for(memento in years[year]){

		var monthName = monthNames[moment(years[year][memento].datetime).month()];
		if(!months[monthName]){
			months[monthName] = [];
		}
		months[monthName].push(years[year][memento]);
	}

	for(month in months){
		memCountList += '<li data-month="' + month + '">' + month + '<span class="memCount">' + months[month].length + '</span></li>\r\n';
	}

	memCountList += '</ul>';
	
  var shadow = document.getElementById('minkWrapper').shadowRoot;

    var yearsNode = shadow.getElementById('years');
    console.log(yearsNode);
    var years = shadow.getElementById('years').childNodes;
    console.log(years.length);
    for(var year=0; year<years.length; year++) {

	$('body /deep/ #drilldownBox').append(memCountList);

	$('body /deep/ #drilldownBox ul#months li').click(function(){
		$('body /deep/ #day,body /deep/ #time').remove();
		$('body /deep/ #drilldownBox ul#months li').removeClass('selectedOption');
		$(this).addClass('selectedOption');

		showMementoCountsByDays(months[$(this).data('month')]);
	});

	//adjustDrilldownPositionalOffset();
	*/
}

function showMementoCountsByDays(mementos){
	var days = {};
	var dayNames = ['NA','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th',
					'11th','12th','13th','14th','15th','16th','17th','18th','19th','20th',
					'21st','22nd','23rd','24th','25th','26th','27th','28th','29th','30th','31st'];

	for(memento in mementos){
		var dayNumber = dayNames[moment(mementos[memento].datetime).date()];
		if(!days[dayNumber]){
			days[dayNumber] = [];
		}
		days[dayNumber].push(mementos[memento]);
	}
	var memCountList = '<ul id="day">';
	for(day in days){
		memCountList += '<li data-day="' + day + '">' + day + '<span class="memCount">' + days[day].length + '</span></li>\r\n';
	}

	memCountList += '</ul>';
	$('body /deep/ #drilldownBox').append(memCountList);
	$('body /deep/ #drilldownBox ul#day li').click(function(){
		$('body /deep/ #time').remove();
		$('body /deep/ #drilldownBox ul#day li').removeClass('selectedOption');
		$(this).addClass('selectedOption');

		showMementoCountsByTime(days[$(this).data('day')]);
	});

	//adjustDrilldownPositionalOffset();
}

function showMementoCountsByTime(mementos) {
	var times = {};
	var uris = {};
	for(memento in mementos){
		var mom = moment(mementos[memento].datetime);
		var time = mom.format('HH:mm:ss');

		if(!times[time]){
			times[time] = [];
			uris[time] = [];
		}
		times[time].push(mementos[memento]);
		uris[time] = mementos[memento].uri;
	}
	var memCountList = '<ul id="time">';
	for(time in times){
		memCountList += '<li data-time="' + uris[time]+ '">' + time + '</li>\r\n';
	}

	memCountList += '</ul>';
	$('body /deep/ #drilldownBox').append(memCountList);
	$('body /deep/ #drilldownBox ul#time li').click(function(){
		window.location = $(this).data('time');
		//console.log(days[$(this).text().substr(0,$(this).text().indexOf(':'))]);
	});

	//adjustDrilldownPositionalOffset();
}

function adjustDrilldownPositionalOffset(){
	var h = $('body /deep/ #drilldownBox').css('height').substr(0,$('body /deep/ #drilldownBox').css('height').indexOf('px'));
	$('body /deep/ #drilldownBox').css('top',((h*-1)-30)+'px');
}



if($('#minkWrapper').length == 0) {
  appendHTMLToShadowDOM();
} else {
  $('#minkWrapper').toggle();
}