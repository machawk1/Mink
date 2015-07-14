function restore_options(){
    chrome.storage.sync.get("uris",function(items){
      console.log(items);
      $(items.uris).each(function(i, v){
        $("#options").append('<li><button class="btn btn-default btn-xs glyphicon glyphicon-remove" type="button"></button>' + v + '</li>');
      });


      //document.getElementById('save').innerHTML = items.uris.join(", ");
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
//document.getElementById('save').addEventListener('click',
//    save_options);
