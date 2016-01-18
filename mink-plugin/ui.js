var shrinking = true; // State variable to show whether the logo is currently shrinking in size
var logoInFocus = false; //used as a conditional for when to stop spinning the logo
var hideLogo = false;
var iconUrl = chrome.extension.getURL('images/icon128.png');
var iconUrlFlipped = chrome.extension.getURL('images/icon128flipped.png');
var previousPanelHTML = ''; //a means of saving the UI to revert to once in the archiveNow panel


function destroyMementoCountsByYear(){
	$('#drilldownBox').addClass('hiddenUI');
}

function showMementoCountsByYear(){
	chrome.storage.local.get('timemaps',
		function(localStore){
			if($('#drilldownBox').hasClass('hiddenUI') && $('#drilldownBox').html() !== ''){
				if(debug) {console.log('returning, ui is empty');}
				$('#drilldownBox').removeClass('hiddenUI');
				return;
			}
			years = null;
			years = {};
			var yearDataFromLastIteration = '';

			function updateProgress(){ /* For debugging */
				console.clear();
				var yearData = '';
				for(var year in years){
					yearData += year + ': ' +years[year].length + '\n';
				}
				console.log(yearData);
				if(yearData == yearDataFromLastIteration) return;
				yearDataFromLastIteration = yearData;
				setTimeout(updateProgress, 3000);
			}

			$(localStore.timemaps).each(function(tmI,tm) {
				$(tm.mementos.list).each(function(mI,m) {
					var dt = moment(m.datetime);
					if(!years[dt.year()]){years[dt.year()] = [];}
					years[dt.year()].push(m);
				});
			});

			if($('#years').html()){ // We already created Miller UI, return
					if(debug){console.log('NOT re-creating Miller');}
					return;
			}

			var memCountList = '<ul id="years">';
			for(var year in years){
				memCountList += '<li data-year="' + year + '">' + year + '<span class="memCount">' + years[year].length + '</span></li>\r\n';
			}

			memCountList += '</ul>';


			if(debug){console.log('coverage test 89');console.log($('drilldownBox'));}

			$('#drilldownBox').append(memCountList);

			$('#drilldownBox ul#years li').click(function(){
				$('#month,#day,#time').remove();
				$('#drilldownBox ul#years li').removeClass('selectedOption');
				$(this).addClass('selectedOption');
				showMementoCountsByMonths($(this).data('year'));
				if(debug) { console.log('coverage test 9943'); }
			});

			//adjust positional offset of year display box based on contents
			adjustDrilldownPositionalOffset();

			//ensure that the new display is visible (it won't be without this for few mementos)
			//$('#drilldownBox').css('display','block');
	}); //end local.get(
}


function adjustDrilldownPositionalOffset(){
	var h = $('#drilldownBox').css('height').substr(0,$('#drilldownBox').css('height').indexOf('px'));
	$('#drilldownBox').css('top',((h*-1)-30)+'px');
}


var years = {};



//var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


function showMementoCountsByMonths(year){
	$('#months,#day,#time').remove();
	//console.log('showing mementos for months in '+year);
	var memCountList = '<ul id="months">';
	var months = {};

	for (var memento in years[year]) {

		var monthName = monthNames[moment(years[year][memento].datetime).month()];
		if(!months[monthName]){
			months[monthName] = [];
		}
		months[monthName].push(years[year][memento]);
	}

	for(var month in months){
		memCountList += '<li data-month="' + month + '">' + month + '<span class="memCount">' + months[month].length + '</span></li>\r\n';
	}

	memCountList += '</ul>';
	$('#drilldownBox').append(memCountList);

	$('#drilldownBox ul#months li').click(function(){
		$('#day,#time').remove();
		$('#drilldownBox ul#months li').removeClass('selectedOption');
		$(this).addClass('selectedOption');

		showMementoCountsByDays(months[$(this).data('month')]);
	});

	adjustDrilldownPositionalOffset();
}

function showMementoCountsByDays(mementos){
	var days = {};
	var dayNames = ['NA','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th',
					'11th','12th','13th','14th','15th','16th','17th','18th','19th','20th',
					'21st','22nd','23rd','24th','25th','26th','27th','28th','29th','30th','31st'];

	for(var memento in mementos){
		var dayNumber = dayNames[moment(mementos[memento].datetime).date()];
		if(!days[dayNumber]){
			days[dayNumber] = [];
		}
		days[dayNumber].push(mementos[memento]);
	}
	var memCountList = '<ul id="day">';
	for(var day in days){
		memCountList += '<li data-day="' + day + '">' + day + '<span class="memCount">' + days[day].length + '</span></li>\r\n';
	}

	memCountList += '</ul>';
	$('#drilldownBox').append(memCountList);
	$('#drilldownBox ul#day li').click(function(){
		$('#time').remove();
		$('#drilldownBox ul#day li').removeClass('selectedOption');
		$(this).addClass('selectedOption');

		showMementoCountsByTime(days[$(this).data('day')]);
	});

	adjustDrilldownPositionalOffset();
}

function showMementoCountsByTime(mementos){
	var times = {};
	var uris = {};
	for(var memento in mementos){
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
	for(var timeIndex in times){
		memCountList += '<li data-time="' + uris[timeIndex]+ '">' + timeIndex + '</li>\r\n';
	}

	memCountList += '</ul>';
	$('#drilldownBox').append(memCountList);
	$('#drilldownBox ul#time li').click(function(){
		window.location = $(this).data('time');
		//console.log(days[$(this).text().substr(0,$(this).text().indexOf(':'))]);
	});

	adjustDrilldownPositionalOffset();
}
