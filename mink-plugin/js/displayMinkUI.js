var MAX_MEMENTOS_IN_DROPDOWN = 500;
var debug = false;
function createShadowDOM(cb) {
   var selector = '#minkuiX';

   var shadow = document.querySelector('#minkWrapper').createShadowRoot();
   var template = document.querySelector(selector);
   //var clone = document.importNode(template, true);
   shadow.appendChild(template);

   if(debug){
     console.log('in createShadowDOM()');
     console.log(cb);
   }
   if(cb) {
     cb();
   }
}

function setupDrilldownInteractions() {
  setupDrilldownInteraction_Year();
}


function appendHTMLToShadowDOM() {
 $.ajax(chrome.extension.getURL('minkui.html'))
 .done(function(data) {
   if(debug){console.log('TODO: before invoking any further, check to verify that some mementos exist (the aggregator query has returned).');}
   
   $('body').append(data);
   var mementos;
   if(tmData && tmData.mementos) {
      mementos = tmData.mementos.list; //e.g. mementos[15].uri and mementos[15].datetime
   }else {
      mementos = [];
   }

   chrome.storage.local.get('timemaps',function(items) {
      var cb = function() {
	      createShadowDOM(setupDrilldownInteractions);
	  };
      var mCount = mementos.length;

      /*console.log(memgator_json);
      console.log(items.timemaps);
      console.log(memgator_json + document.URL);
      console.log(items.timemaps[memgator_json + document.URL]);
      console.log(items.timemaps[memgator_json + document.URL].mementos);
      console.log(items.timemaps[memgator_json + document.URL].datetime);*/
      var uri_t = memgator_json + document.URL;

	  if(items.timemaps && items.timemaps[document.URL] && items.timemaps[document.URL].mementos && items.timemaps[document.URL].datetime) {
	    if(debug){console.log('qq');}
	    mCount = items.timemaps[document.URL].mementos.length;
	    if(debug){
	      console.log('c');
	      console.log('isAMemento, hide ALL THE THINGS!');
	    }
	    $('.dropdown').addClass('hidden');
	    $('#drilldownBox').addClass('hidden');
	    $('#steps').addClass('hidden');
	    $('#title_dropdown').addClass('hidden');
	    $('#archiveNow').addClass('hidden');
	    $('#viewingMementoInterface').removeClass('hidden');
	    $('#mementosAvailable').html('Viewing memento at ' + (new Date(items.timemaps[document.URL].datetime)));
	    cb = createShadowDOM;
      }else if(mCount > MAX_MEMENTOS_IN_DROPDOWN) {
          if(debug){console.log('rr');}
	      $('.dropdown').addClass('hidden');
          $('#steps .action').removeClass('active');
          $('#title_drilldown').addClass('active');
          buildDropDown([]);
          buildDrilldown_Year(items.timemaps[document.URL].mementos.list);
          if(debug){console.log('a');}
	   }else if(mCount === 0) {
	      if(debug){console.log('b');}
          switchToArchiveNowInterface();
	   }else {
          if(debug){console.log('d');}
          buildDropDown(mementos);
          buildDrilldown_Year(mementos);
          $('#drilldownBox').addClass('hidden');
          $('#steps .action').removeClass('active');
          $('#title_dropdown').addClass('active');
        }

        if(debug){console.warn('** About to append CSS1');}
        $('#mementosAvailable span').html(mCount);
        if(debug){console.warn('** About to append CSS2');}
        appendCSSToShadowDOM(cb);
    });



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
     mementoSelections += '<option data-uri="' + mementos[mm].uri + '" data-datetime="'+ mementos[mm].datetime + '">' + (new Date(mementos[mm].datetime)) + '</option>';
   }

   $('#mementosDropdown').attr('data-memento-count', mementos.length);
   if(mementos.length === 0) {
         $('#title_dropdown').addClass('disabled');
    }
   $('#mementosDropdown').append(mementoSelections);
   /*$('#mementosDropdown').select2({
      templateResult: formatArchiveDropdown,
      theme: "classic"
   });
   $('#mementosDropdown').replaceWith($('#select2-mementosDropdown-results'));*/
}

var dropdownIcon_ia = chrome.extension.getURL('images/archives/dropdown_ia.png');
var dropdownIcon_wc = chrome.extension.getURL('images/archives/dropdown_wc.png');
var dropdownIcon_ais = chrome.extension.getURL('images/archives/dropdown_ais.png');


function formatArchiveDropdown(ddEntry) {
  if (!ddEntry.id) { return ddEntry.text; }
  var urim = $(ddEntry.element).data('uri') || '';
  
  var imgSrc = '';
  
  if(urim.indexOf('web.archive.org') !== -1) {
    imgSrc = dropdownIcon_ia;
  }else if(urim.indexOf('webcitation.org') !== -1) {
    imgSrc = dropdownIcon_wc;
  }else if(urim.indexOf('archive.is') !== -1) {
    imgSrc = dropdownIcon_ais;
  }
  
  var $ddEntry = ddEntry.text;
  if(imgSrc !== '') {
    $ddEntry = $('<span><img src="'+imgSrc+'" /> ' + ddEntry.text + '</span>');
  }
  return $ddEntry;
}

function switchToArchiveNowInterface() {
  $('#mementosDropdown').addClass('noMementos');
  $('#drilldownBox').addClass('noMementos');
  $('#viewMementoButton').addClass('noMementos');
  $('#minkStatus #steps').addClass('noMementos');


  $('#archiveNow').addClass('noMementos');
  $('#archiveNowInterface').removeClass('hidden');
  $('.hideInNoMementosInterface').addClass('hidden');
}

function appendCSSToShadowDOM(cb) {
  if(debug){
    console.log('APPENDING CSS!');
    console.log(cb);
  }

  $.ajax(chrome.extension.getURL('css/minkui.css'))
   .done(function(data) {
     var styleElement = '<style type="text/css">\n' + data + '\n</style>\n';
     $('#minkuiX').prepend(styleElement);
     cb();
  });
}

function randomEmail() {
    var emails = ['gmail.com','outlook.com','yahoo.com','me.com'];
    //create random function
    var randy = function(min,max) {
        return Math.floor(Math.random() * (max-min + 1)+ min);
    };

    //choices for the email character pool
    var alpha = 'abcdefghijklmnopqrstuvwxyz';
    var choices = 'abcdefghijklmnopqrstuvwxyz' + '0123456789';
    var domain = ['.com', '.org', '.edu', '.co.uk', '.net'][randy(0,4)];

    var text = '';

    //have a function that will make a unique part of an
    //email 1 to 3 characters long
    var getPart = function (pool){
        var len = randy(1,3);
        var it = '';
        for(var i = 0; i < len; ++i){
            it += pool.charAt(randy(0,pool.length-1));
        }
        return it;
    };

    var len = randy(2,4);
    //get user portion of email
    for(var i = 0; i < len; ++i){
        text += getPart(choices);
    }

    text += '@';

    len = randy(2,3);
    //get email host
    for(i = 0; i < len; ++i){
        text += getPart(alpha);
    }

    //append the domain
    text += domain;

    return text;
}

function archiveURI_webCite(cb) {
    if (debug) {
        console.log("Archiving for WebCite");
    }

    var remail = randomEmail();
    $.ajax({
        method: 'POST',
        url: 'http://www.webcitation.org/archive',
        data: {
            url: document.URL,
            email: remail
        }
    }).done(function (data, status,xhr) {
        if(status == 'success'){
            chrome.runtime.sendMessage({
                method: 'notify',
                title: 'Mink',
                body: 'WebCitation.org Successfully Preserved page.\r\nSelect again to view.'
            });
            if(cb){
                cb();
            }
            
            var shadow = document.getElementById('minkWrapper').shadowRoot;
            shadow.getElementById('archivelogo_webcite').classList.add('archiveNowSuccess');
            //verbose regex but wanted to ensure exact capture
            var archiveURI = data.match(/([A-Za-z]{4,5}:\/\/[a-z]{3}.[a-z]{11}.[a-z]{3}\/[a-zA-z0-9]{9})/g)[0];
            shadow.getElementById('archivelogo_webcite').setAttribute('title', archiveURI);
            shadow.getElementById('archivelogo_webcite').onclick = function() {
                window.location = $(this).attr('title');
            };
            if(debug){
                console.log("\nattempting to extract url: ");
                //very verbose but want exactly the shortend link
                console.log(data.match(/([A-Za-z]{4,5}:\/\/[a-z]{3}.[a-z]{11}.[a-z]{3}\/[a-zA-z0-9]{9})/g));
                console.log(archiveURI);
            }
        } else {
            chrome.runtime.sendMessage({
                method: 'notify',
                title: 'Mink',
                body: 'WebCitation.org Did Not Successfully Preserved page.\r\n'
            });
        }
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
			if(cb) {
			  cb();
      }

			var shadow = document.getElementById('minkWrapper').shadowRoot;
			shadow.getElementById('archivelogo_ia').classList.add('archiveNowSuccess');

			//$('#archiveNow_archivedotorg').html('View on Archive.org');
			var parsedRawArchivedURI = a.match(/\"\/web\/.*\"/g);
			var archiveURI = 'http://web.archive.org' + parsedRawArchivedURI[0].substring(1,parsedRawArchivedURI[0].length - 1);
			shadow.getElementById('archivelogo_ia').setAttribute('title', archiveURI);
			shadow.getElementById('archivelogo_ia').onclick = function() {
			  window.location = $(this).attr('title');
			};


			//refreshAggregatorsTimeMap(document.URL);
		}
	});
}

function archiveURI_archiveDotIs(cb) {
    if(debug){console.log('submitting to archive.is');}
	$.ajax({
		method: 'POST',
		url: 'http://archive.is/submit/',
		data: { coo: '', url: document.URL}
	})
	.done(function(data,status,xhr){
		//console.log(a);
		if(debug){console.log('success on ais submission');}
		if(status == 'success'){
			chrome.runtime.sendMessage({
				method: 'notify',
				title: 'Mink',
				body: 'Archive.is Successfully Preserved page.\r\nSelect again to view.'
			});
			if(cb) {
  			cb();
      } 
      
			$('#archiveNow_archivedotis').addClass('archiveNowSuccess');

			var linkHeader = xhr.getResponseHeader('link');

			var tmFromLinkHeader = new Timemap(linkHeader);

			var archiveURI = tmFromLinkHeader.mementos[tmFromLinkHeader.mementos.length - 1].uri;

			var shadow = document.getElementById('minkWrapper').shadowRoot;
			shadow.getElementById('archivelogo_ais').classList.add('archiveNowSuccess');

			shadow.getElementById('archivelogo_ais').setAttribute('title', archiveURI);
			shadow.getElementById('archivelogo_ais').onclick = function() {
			  window.location = $(this).attr('title');
			};

			    //refreshAggregatorsTimeMap(document.URL);
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
        $('#archiveNow_webcite').trigger('click');
        $(this).html('View All');
        $(this).addClass('archiveNowSuccess');
    });
}


var years = {};
var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var dayNames = ['NA','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th',
					'11th','12th','13th','14th','15th','16th','17th','18th','19th','20th',
					'21st','22nd','23rd','24th','25th','26th','27th','28th','29th','30th','31st'];

function buildDrilldown_Year(mementos){
// NOTE: Shadow DOM not yet built. Do so after this function
	years = null;
	years = {};
	var yearDataFromLastIteration = '';

    if(debug){
      console.warn('building drilldown');
      console.log(mementos);
    }

	$(mementos).each(function(mI,m) {
		var dt = moment(m.datetime);
		if(!years[dt.year()]){years[dt.year()] = [];}
		years[dt.year()].push(m);
	});

	var memCountList = '<ul id="years">';
	for(var year in years){
		memCountList += '<li data-year="' + year + '">' + year + '<span class="memCount">' + years[year].length + '</span></li>\r\n';
	}

	memCountList += '</ul>';

    var drilldown = document.getElementById('drilldownBox');
    if(debug){console.log(memCountList);}
	$('body #drilldownBox').append(memCountList);
}

function setupDrilldownInteraction_Year() {
    if(!tmData) {console.log('There are likely no mementos'); return;}
    var mementos = tmData.mementos.list;
    if(debug){console.log('setting up...');}
    var shadow = document.getElementById('minkWrapper').shadowRoot;

    var yearsNode = shadow.getElementById('years');
    //console.log(yearsNode);
    var years = shadow.getElementById('years').childNodes;
    //console.log(years.length);
    for(var year=0; year<years.length; year++) {
      //console.log(years[year]);
      years[year].onclick = function(event){
          var existingMonthsUL = shadow.getElementById('months');
          var existingDaysUL = shadow.getElementById('days');
          var existingTimesUL = shadow.getElementById('times');
          var drilldownShadow = shadow.getElementById('drilldownBox');

          if(existingMonthsUL) {
              drilldownShadow.removeChild(existingMonthsUL);
          }
          if(existingDaysUL) {
              drilldownShadow.removeChild(existingDaysUL);
          }
          if(existingTimesUL) {
              drilldownShadow.removeChild(existingTimesUL);
          }

      	  buildDrilldown_Month($(this).data('year'));
      	  $(this).siblings().removeClass('selectedOption');
      	  $(this).addClass('selectedOption');
      };
    }
    if(debug){console.log('Done setting up drilldown');}
 }




function buildDrilldown_Month(year){
    var mementos = tmData.mementos.list;

	var monthUL = document.createElement('ul');
	monthUL.id = 'months';

	var months = {};

	for(var memento in mementos) {
        var datetime = moment(mementos[memento].datetime);
        if(datetime.year() !== year) {
            continue;
        }
		var monthName = monthNames[datetime.month()];
		if(!months[monthName]){
			months[monthName] = [];
		}
		months[monthName].push(year[memento]);
	}

	for(var month in months){
		var li = document.createElement('li');
		li.setAttribute('data-month', month);
		li.setAttribute('data-year', year);
		li.appendChild(document.createTextNode(month));

		var liSpan = document.createElement('span');
		liSpan.className = 'memCount';
		liSpan.appendChild(document.createTextNode(months[month].length));

		//console.log(month);
		li.appendChild(liSpan);
		li.onclick = function(event){
      	    buildDrilldown_Day($(this).data('year'), $(this).data('month'));
      	    $(this).siblings().removeClass('selectedOption');
      	    $(this).addClass('selectedOption');
        };

		monthUL.appendChild(li);
	}

    var drilldown = document.getElementById('drilldownBox');
    var shadow = document.getElementById('minkWrapper').shadowRoot;

    var existingMonthsUL = shadow.getElementById('months');
    var existingDaysUL = shadow.getElementById('days');
    var existingTimesUL = shadow.getElementById('times');
    var drilldownShadow = shadow.getElementById('drilldownBox');

    if(existingMonthsUL) {
        drilldownShadow.removeChild(existingMonthsUL);
    }
    if(existingDaysUL) {
        drilldownShadow.removeChild(existingDaysUL);
    }
    if(existingTimesUL) {
        drilldownShadow.removeChild(existingTimesUL);
    }

    drilldownShadow.appendChild(monthUL);
}



function buildDrilldown_Day(year, month){
    var mementos = tmData.mementos.list;

	var dayUL = document.createElement('ul');
	dayUL.id = 'days';

	var days = {};

	for(var memento in mementos){
        var datetime = moment(mementos[memento].datetime);

        if(datetime.year() !== year || monthNames[datetime.month()] !== month) {
            continue;
        }
		var dayName = dayNames[datetime.date()];
		if(!days[dayName]){
			days[dayName] = [];
		}
		days[dayName].push(mementos[memento]);
	}

	for(var day in days){
		var li = document.createElement('li');
		li.setAttribute('data-date', day);
		li.setAttribute('data-month', month);
		li.setAttribute('data-year', year);
		li.appendChild(document.createTextNode(day));

		var liSpan = document.createElement('span');
		liSpan.className = 'memCount';
		liSpan.appendChild(document.createTextNode(days[day].length));

		li.appendChild(liSpan);
		li.onclick = function(event){
      	    buildDrilldown_Time($(this).data('year'), $(this).data('month'), parseInt($(this).data('date')));
      	    $(this).siblings().removeClass('selectedOption');
      	    $(this).addClass('selectedOption');
        };

		dayUL.appendChild(li);
	}

    var drilldown = document.getElementById('drilldownBox');
    var shadow = document.getElementById('minkWrapper').shadowRoot;

    var existingDaysUL = shadow.getElementById('days');
    var existingTimesUL = shadow.getElementById('times');
    var drilldownShadow = shadow.getElementById('drilldownBox');

    if(existingDaysUL) {
        drilldownShadow.removeChild(existingDaysUL);
    }
    if(existingTimesUL) {
        drilldownShadow.removeChild(existingTimesUL);
    }

    drilldownShadow.appendChild(dayUL);
}

function buildDrilldown_Time(year, month, date){
    var mementos = tmData.mementos.list;

	var timeUL = document.createElement('ul');
	timeUL.id = 'times';

	var times = [];

	for(var memento in mementos){
        var datetime = moment(mementos[memento].datetime);

        if(datetime.year() !== year || monthNames[datetime.month()] !== month || datetime.date() !== date) {
            //console.log('Reject: ' + year + '!=' + datetime.year() + ' ' + month + '!=' + monthNames[datetime.month()] + ' ' + date + '!=' + datetime.date() + ' >> ' + mementos[memento].datetime);
            //console.log(datetime.year() !== year);
            //console.log(monthNames[datetime.month()] !== month);
            //console.log(dayNames[datetime.date()] !== date);
            continue;
        }
        //console.log('Accept: ' + year + '!=' + datetime.year() + ' ' + month + '!=' + datetime.month() + ' ' + date + '!=' + datetime.date());

        var time = addZ(datetime.hour()) + ':' + addZ(datetime.minute()) + ':' + addZ(datetime.second());
        mementos[memento].time = time;
		times.push(mementos[memento]);
	}

	for(var timeIndex in times){
		var li = document.createElement('li');
		li.setAttribute('data-time', timeIndex);
		li.setAttribute('data-day', date);
		li.setAttribute('data-month', month);
		li.setAttribute('data-year', year);
		li.appendChild(document.createTextNode(times[timeIndex].time));

		li.onclick = function(event){
			$(this).siblings().removeClass('selectedOption');
		  $(this).addClass('selectedOption');
      window.location = times[timeIndex].uri;
    };

		timeUL.appendChild(li);
	}

    var drilldown = document.getElementById('drilldownBox');
    var shadow = document.getElementById('minkWrapper').shadowRoot;

    var existingTimesUL = shadow.getElementById('times');
    var drilldownShadow = shadow.getElementById('drilldownBox');

    if(existingTimesUL) {
        drilldownShadow.removeChild(existingTimesUL);
    }
    drilldownShadow.appendChild(timeUL);
}

if($('#minkWrapper').length === 0) {
  if(debug) {console.log('appending HTML to Shadow DOM');}
  appendHTMLToShadowDOM();
} else {
  $('#minkWrapper').toggle();
}
