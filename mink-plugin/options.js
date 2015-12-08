var tmDropdownString = '<option>--- Select to view URIs with cached TimeMaps ---</option>';

function restore_options(){
    chrome.storage.local.get("uris",function(items){
      console.log(items);
      $(items.uris).each(function(i, v){
        $("#options").append(getListItemHTML(v, 'glyphicon-remove'));
      });
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
      });
    });
}

function getListItemHTML(uri, classIn){
  return '<li><button class="btn btn-default btn-xs glyphicon ' + classIn + ' remove" type="button"></button><span>' + uri + '</span></li>';
}

function saveBlacklist(){
  $("#options").children().each(function(){
    console.log($(this).text());
  });
  return;
  /*
  chrome.storage.local.set(save,
    function(){
      if(debug){
        console.log("done adding "+uri+" to blacklist. Prev blacklist:");
        console.log(currentBlacklist);
        getBlacklist();
      }
    }
  );*/
}

function updateSaveButtonStatus(){
    if($('.glyphicon-ok').length > 0 || $('.newEntry').length > 0){
        $("#save").removeAttr('disabled').removeClass("disabled");
    }else {
        $('#save').attr('disabled','disabled').addClass("disabled");
    }
}


function createAddURIBinder(){
    $("#add").click(function(){
      $("#options").prepend('<li><input type="text" placeholder="http://" id="newURI" /><button id="addToBlacklist">Add to Blacklist</button></li>');
      $("#addToBlacklist").click(function(){
        var uri = $('#newURI').val();

        $(this).parent().replaceWith(getListItemHTML(uri, 'glyphicon-plus newItem'));
        $('.newItem').removeClass('newItem').parent().addClass('newEntry');
        //$('.newEntry').append('<button  class="btn btn-default btn-xs glyphicon glyphicon-chevron-left" style="font-size: 12px; margin-left: 1.0em;">Nevermind</button>');
        updateSaveButtonStatus();
      });
    });
}

function populatedCachedTimeMapsUI() {
  chrome.storage.local.get('timemaps',function(items) {
    var tms = items.timemaps;

    var keys = Object.keys(tms);
    var uriPluralityString = keys.length === 1 ? 'URI' : 'URIs';
    $('#cachedTimemaps').append(tmDropdownString);
    for(var tm = 0; tm < keys.length; tm++) {
      var originalURI = tms[keys[tm]].original;
      $('#cachedTimemaps').append('<option>' + originalURI + '</option>');
    }
  });
}

function removeTMFromCache(originalURI) {
  chrome.storage.local.get('timemaps', function(items) {
    var tms = items.timemaps;
    delete tms[originalURI];
    chrome.storage.local.set({'timemaps':tms},
      function() {
        console.log('Cache updated, updating UI');
        $('#cachedTimemaps').html(tmDropdownString);
        populateCachedTimeMapsUI();
      };
    );
    
}

document.addEventListener('DOMContentLoaded', restore_options);
document.addEventListener('DOMContentLoaded', updateSaveButtonStatus);
document.addEventListener('DOMContentLoaded', createAddURIBinder);
document.addEventListener('DOMContentLoaded', populatedCachedTimeMapsUI);

$('#removeSelectedTMFromCache').click(function() {
  var oURI = $('#cachedTimemaps option:selected').text();
  console.log(oURI);
  removeTMFromCache(oURI);
});
//document.getElementById('save').addEventListener('click',
//    save_options);
