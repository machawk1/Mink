function Timemap(fromString){
	if(debug){console.log("In timemap");}
	var timemap, timegate, original, url, self;
	this.str = fromString;


	//parse out timegate
	var linkHeaderEntries = this.str.split(",");

	var mementoUrlExpression = /<[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?>/gi;
	var murlregex = new RegExp(mementoUrlExpression); //regex to get a memento URI

	var mementoRelTimegateExpression = /rel=.*timegate.*/gi;
	var mtimegateregex = new RegExp(mementoRelTimegateExpression); //regex to get timegate

	var mementoRelTimemapExpression = /rel=.*timemap.*/gi;
	var mtimemapregex = new RegExp(mementoRelTimemapExpression); //regex to get timemap

	var mementoRelOriginalExpression = /rel=.*original.*/gi;
	var moriginalregex = new RegExp(mementoRelOriginalExpression); //regex to get original

	var mementoRelMementoExpression = /rel=.*memento.*/gi;
	var mementoregex = new RegExp(mementoRelMementoExpression); //regex to get a memento

	var mementoRelSelfExpression = /rel=.*self.*/gi;
	var mselfregex = new RegExp(mementoRelSelfExpression); //regex to get a memento


	this.mementos = [];

	for(var lhe=0; lhe<linkHeaderEntries.length; lhe++){
		var partsOfEntry = linkHeaderEntries[lhe].split(";");
		var potentialMemento = null;

		for(var partOfEntry=0; partOfEntry<partsOfEntry.length; partOfEntry++){
			if(partsOfEntry[partOfEntry].match(murlregex)){
				url = partsOfEntry[partOfEntry];
			}

			/* Splitting into multiple ifs instead of if-else allows for e.g., rel="timegate original" */
			if(partsOfEntry[partOfEntry].match(mtimegateregex)){
				timegate = url;
			}
			if(partsOfEntry[partOfEntry].match(mtimemapregex)){
				timemap = url;
			}
			if(partsOfEntry[partOfEntry].match(moriginalregex)){
				original = url;
			}
			if(partsOfEntry[partOfEntry].match(mselfregex)){
				self = url;
			}
			if(partsOfEntry[partOfEntry].match(mementoregex)){
				this.mementos.push(new Memento(linkHeaderEntries[lhe]+linkHeaderEntries[lhe+1]));
			}
		}
	}


	var mementoMetadataObject = {};
	if(timemap){	this.timemap = sanitizeMementoURI(timemap);}
	if(timegate){	this.timegate = sanitizeMementoURI(timegate);}
	if(original){	this.original = sanitizeMementoURI(original);}
	if(self){	this.self = sanitizeMementoURI(self);}

	if(!original){console.log("Hmm, no original"); }

	if(!timemap && !timegate && !original){
		console.log("Link header exists, but we didn't time a timemap, timegate or original value in the header.");
		console.log(linkHeaderEntries);
	}
}

function Memento(fromStr){
	this.str = fromStr;
	this.first = false;
	this.last = false;
	this.next = null;
	this.prev = null;

	if(!fromStr){return;}

	this.uri = this.str.substring(this.str.indexOf("<")+1,this.str.indexOf(">"));
	this.datetime = this.str.substr(this.str.indexOf("datetime")); //abbreviation to just include datetime string and on
	this.datetime = this.datetime.substr(this.datetime.indexOf("\"")).replace(/"/g,"").trim();
}

/* ***************************
   PUT BELOW IN UTIL.JS
*************************** */

function sanitizeMementoURI(mURI){
	var ret = mURI.trim();
	if(ret.substr(0,1) == "<" && ret.substr(ret.length-1,1) == ">"){
		ret = ret.substr(1,ret.length-2); //remove first and last characters
	}
	return ret;
}
