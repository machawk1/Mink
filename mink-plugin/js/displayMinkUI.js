var MAX_MEMENTOS_IN_DROPDOWN = 500;

function createShadowDOM() {
   var selector = '#minkuiX';
   
   var shadow = document.querySelector('#minkWrapper').createShadowRoot();
   var template = document.querySelector(selector);
   //var clone = document.importNode(template, true);
   shadow.appendChild(template);
}



function appendHTMLToShadowDOM() {
 $.ajax(chrome.extension.getURL('minkui.html'))
 .done(function(data) {
   console.log('TODO: before invoking any further, check to verify that some mementos exist (the aggregator query has returned).');
   
   $('body').append(data);
   
   var mementos = tmData.mementos.list; //e.g. mementos[15].uri and mementos[15].datetime
   
   if(mementos.length > MAX_MEMENTOS_IN_DROPDOWN) {
     // TODO: call Miller column builder here
     console.log('TODO: call Miller column builder here');
     $('.dropdown').hide();
   }else if(mementos.length === 0) {
     switchToArchiveNowInterface();     
   }else {
     buildDropDown(mementos);
   }
   
   $('#mementosAvailable span').html(mementos.length);
   appendCSSToShadowDOM();
  });
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

if($('#minkWrapper').length == 0) {
  appendHTMLToShadowDOM();
} else {
  $('#minkWrapper').toggle();
}