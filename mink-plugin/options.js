var debug = true;

var tmDropdownString = '<option>&nbsp;&nbsp;&darr; Mink has TimeMaps for... &darr;</option>';
var tmDropdownNoTimemapsString = '<option>--- No TimeMaps available ---</option>';

function restore_options(){
    chrome.storage.local.get('blacklist', function(items) {
      $(items.blacklist).each(function(i, v){
        $("#options").append(getListItemHTML(v, 'glyphicon-remove'));
      });
      updateSaveButtonStatus();
      updateRemoveAllBlacklistButtonStatus();
      
      $(".remove").click(function(){
        if($(this).hasClass('glyphicon-remove')){
          var uriToStrike = $(this).parent().text();
          $(this).parent().addClass("strike");
          $(this).toggleClass('glyphicon-remove glyphicon-ok');
        }else {
          $(this).toggleClass('glyphicon-ok glyphicon-remove');
          $(this).parent().removeClass("strike");
        }
        updateSaveButtonStatus();
        updateRemoveAllBlacklistButtonStatus();
        
      });
    });
}

function getListItemHTML(uri, classIn, buttonText){
  if(!buttonText) {
    buttonText = '';
  }
  return '<li><button class="btn btn-default btn-xs glyphicon ' + classIn + ' remove" type="button">' + buttonText + '</button><span>' + uri + '</span></li>';
}


function clearBlacklist() {
  chrome.storage.local.set({'blacklist': []});
  document.location.reload();
}

function saveBlacklist(dontReload){
  var blacklistJSON = {};
  var uris = [];
  $('#options li:not(.strike) span').each(function(){
    uris.push($(this).text());
  });

  blacklistJSON.blacklist = uris;
  chrome.storage.local.set(blacklistJSON);
  $('.newEntry').removeClass('newEntry'); // Disable indicator for unsaved data
  updateSaveButtonStatus();
  
  if(!dontReload) {
    document.location.reload();
  }
}

function updateSaveButtonStatus(){
  var saveBlacklistButton = $('#saveBlacklist');
  if($('.glyphicon-ok').length > 0 || $('.newEntry').length > 0) {
    saveBlacklistButton.removeAttr('disabled').removeClass('disabled');
  }else {
    saveBlacklistButton.attr('disabled','disabled').addClass('disabled');
  }
}

function updateRemoveAllBlacklistButtonStatus() {
  var clearBlacklistButton = $('#clearBlacklist');
  if(debug){
    console.log($('#options li').length);
    console.log($('#options li'));
  }
  if($('#options li').length > 0) {
    clearBlacklistButton.removeAttr('disabled').removeClass('disabled');
  }else {
    clearBlacklistButton.attr('disabled','disabled').addClass('disabled');
  }
}

function createAddURIBinder(){
    $("#add").click(function(){
      addMinkBlacklistToBeSavedLI();
      bindAddBlacklistEntryUI();
    });
}

function bindAddBlacklistEntryUI() {
  $('.uriTextField').keyup(function() {
    var uriFieldValue = $(this).val();
    if(uriFieldValue.length == 0) {
      $(this).parent().find('button.addToBlacklist').attr('disabled',true);
    }else {
      $(this).parent().find('button.addToBlacklist').removeAttr('disabled');
    }
  });
  $('.addToBlacklist').click(addToBlacklistToBeSaved);
  $('.cancelAddToBlacklist').click(removeFromBlacklistToBeSaved);
}

function addMinkBlacklistToBeSavedLI(valIn) {
  if(!valIn) {
    valIn = '';
  }
  $("#options").prepend('<li><input type="text" placeholder="http://"  class="uriTextField" id="newURI" "' + valIn + '"/><button class="addToBlacklist" disabled>Add to Blacklist</button><button class="cancelAddToBlacklist">Cancel</button></li>');
}

function addToBlacklistToBeSaved() {
  var uri = $(this).parent().find('.uriTextField').val();
  if(uri.substr(0,4) !== 'http') {
    uri = 'http://' + uri;
  }


  $(this).parent().replaceWith(getListItemHTML(uri, 'glyphicon-remove newItem'));
  $('.newItem').click(removeEntry);
  $('.newItem').removeClass('newItem').parent().addClass('newEntry');
  // $('.newEntry').append('<button  class="btn btn-default btn-xs glyphicon glyphicon-chevron-left" style="font-size: 12px; margin-left: 1.0em;">Nevermind</button>');
  updateSaveButtonStatus();
}

function removeFromBlacklistToBeSaved() {
  $(this).parent().remove();
}

function removeEntry() {
  $(this).parent().remove();
  updateSaveButtonStatus();
}

function populatedCachedTimeMapsUI() {
  chrome.storage.local.get('timemaps',function(items) {
    if(debug){
      console.log('items in the TM localstorage');
      console.log(items);
    }
  
    var tms = items.timemaps;

    var keys = tms ? Object.keys(tms) : 0;
    var uriPluralityString = keys.length === 1 ? 'URI' : 'URIs';
    
    if(keys.length) {
		$('#cachedTimemaps').append(tmDropdownString);
		for(var tm = 0; tm < keys.length; tm++) {      
		  var originalURI = tms[keys[tm]].original_uri;
		  if(!tms[keys[tm]].original_uri) {
		    originalURI = keys[tm];
		  }
		  $('#cachedTimemaps').append('<option>' + originalURI + '</option>');
		}
		enableRemoveButtons(false,'#removeAllTMsFromCache');
		$('#cachedTimemaps').change(enableRemoveButtonsBasedOnDropdown);
	}else {
	    $('#cachedTimemaps').append(tmDropdownNoTimemapsString);
	    enableRemoveButtons(true, '#cachedTimemaps, #removeAllTMsFromCache');
	}
	enableRemoveButtonsBasedOnDropdown();
  });
}

function updateMementoCount() {
  chrome.storage.local.get('timemaps',function(items) {
    console.log(items.timemaps);
    console.log(items.timemaps[$('#cachedTimemaps').val()]);
	$('#mementoCount').html(items.timemaps[$('#cachedTimemaps').val()].mementos.list.length + ' mementos available');
  });
}

function resetMementoCount() {
  $('#mementoCount').html('');
}

function enableRemoveButtons(disable, additionalIdsIn) {
  var additionalIds = '';
  if(additionalIdsIn) {
    additionalIds = ',' + additionalIdsIn;
  }
  var buttonIds = '#removeSelectedTMFromCache, #removeSelectedTMFromCacheAndBlacklist' + additionalIds;
  $(buttonIds).prop('disabled', disable);
}

function enableRemoveButtonsBasedOnDropdown() {
  var selectedIndex = $(this).find('option:selected').index();
  if(selectedIndex > 0) { // -1 would be valid with the verbose conditional
    enableRemoveButtons(false);
    updateMementoCount();
  }else { // selected index is 0, disable
    enableRemoveButtons(true);
    resetMementoCount();
  }
}

function removeTMFromCache(originalURI) {
  chrome.storage.local.get('timemaps', function(items) {
    var tms = items.timemaps;
    delete tms[originalURI];
    chrome.storage.local.set({'timemaps':tms},
      function() {
        console.log('Cache updated, updating UI');
        $('#cachedTimemaps').empty();
        populatedCachedTimeMapsUI();
      }
    );
  });
}

function clearTimemapCache() {
  chrome.storage.local.set({'timemaps':{}},
      function() {
        console.log('Remove all cached TMs');
        $('#cachedTimemaps').empty();
        populatedCachedTimeMapsUI();
      }
    );
}

function saveAndCloseOptionsPanel() {
  saveBlacklist();
  window.close();
}

function restoreDefaults() {
  clearBlacklist();
  clearTimemapCache();
}

function removeSelectedURIFromTimeMapCache() {
  var oURI = $('#cachedTimemaps option:selected').text();
  removeTMFromCache(oURI);
}

function addSelectedURIToBlacklist() {
  var oURI = $('#cachedTimemaps option:selected').text();
  $('#options').append('<li class="strike"><span>' + oURI + '</li>');
  
}

document.addEventListener('DOMContentLoaded', restore_options);
document.addEventListener('DOMContentLoaded', createAddURIBinder);
document.addEventListener('DOMContentLoaded', populatedCachedTimeMapsUI);

$('#removeSelectedTMFromCache').click(removeSelectedURIFromTimeMapCache);
$('#removeSelectedTMFromCacheAndBlacklist').click(function() {
  addSelectedURIToBlacklist();
  var dontReloadAfterSavingBlacklist = true;
  saveBlacklist(dontReloadAfterSavingBlacklist);
  removeSelectedURIFromTimeMapCache();
});

$('#removeAllTMsFromCache').click(clearTimemapCache);

$('#saveBlacklist').click(saveBlacklist);
$('#clearBlacklist').click(clearBlacklist);
$('#doneButton').click(saveAndCloseOptionsPanel);
$('#restoreDefaultsButton').click(restoreDefaults);
//document.getElementById('save').addEventListener('click',
//    save_options);
