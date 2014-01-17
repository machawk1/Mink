// Save this script as `options.js`

// Saves options to localStorage.
function save_options() {
  if( $('textarea').length > 0){ //editing timegate list
	console.log($(($('textarea'))[0]).val());
    localStorage["timegates"] = $(($('textarea'))[0]).val();

    chrome.tabs.reload();
  }
	
  var timegate = $("#timegate").find(":selected").html();
  localStorage["preferredTimegate"] = timegate;

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  var timegate = localStorage["preferredTimegate"];
  if (!timegate) {
    return;
  }
  var select = document.getElementById("timegate");
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == timegate) {
      child.selected = "true";
      break;
    }
  }
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);

if(!localStorage['timegates']){
	resetToDefaultTimegate();
}

var options = localStorage['timegates'].split("\n");
var sstr = "";

for(var o in options){
	if(options[o] != ""){
		sstr += "\t<option class=\"validOption\">"+options[o]+"<\/options>\n";
		
	}
}
$("#timegate").prepend(sstr);

function resetToDefaultTimegate(){
	localStorage['timegates'] = 
		"http://mementoproxy.cs.odu.edu/aggr/timegate/\n" +
		"http://mementoproxy.lanl.gov/aggr/timegate/\n"
		;
	localStorage['preferredTimegate'] = 
		"http://mementoproxy.cs.odu.edu/aggr/timegate/\n" +
		"http://mementoproxy.lanl.gov/aggr/timegate/\n"
		;
	chrome.tabs.reload();
}

$("#timegate").change(function(){
	
	var manage = ($(this).find("option:selected").attr("id") == "manage");
	if(manage){
		var options = $("#timegate > option.validOption");
		var str = "";
		for(var option in options){
			try{
				str += $(options[option]).html() +"\r\n"
			}
			catch(err){
				break;
			}
		}

		$("#timegate").replaceWith("<textarea class=\"edit\">"+str+"</textarea>");
		$(".edit").after("<button class=\"edit\">Reset</button>");
		$("button.edit").click(resetToDefaultTimegate);
		
    }
});

//http://testcase.rubyforge.org/articles/simple-case
//also, http://pivotal.github.io/jasmine/
var Test = TestCase.create({
  name: 'Calling an original resource with the default timegate',

  testFoo: function() {
    this.assert(true);
  }
});
