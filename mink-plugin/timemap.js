/* global debug */
debug = false

function isValidURL (string) {
  try {
    return new URL(string) instanceof URL
  } catch (_) {
    return false
  }
}

function Timemap (fromString) {
  if (debug) { console.log('In timemap.js') }
  let timemap, timegate, original, url, self
  this.str = fromString
  if (!this.str) {
    if (debug) {
      console.log('data passed in was null')
    }
    return
  }

  // Check if the string passed in is an Object, e.g., https://github.com/
  const strIsAnObject = (typeof this.str === 'object') && (this.str !== null)
  if (debug) {
    // console.log(this.str)
    console.log('type: ' + typeof this.str)
  }
  if (strIsAnObject) {
    if (debug) {
      console.log('Handle fromString as an object, akin to github.com')
    }
  //    this = this.str
  }

  const linkHeaderEntries = this.str.split(',')

  const mementoRelTimegateExpression = /rel=.*timegate.*/gi
  const mtimegateregex = new RegExp(mementoRelTimegateExpression) // Regex to get timegate

  const mementoRelTimemapExpression = /rel=.*timemap.*/gi
  const mtimemapregex = new RegExp(mementoRelTimemapExpression) // Regex to get timemap

  const mementoRelOriginalExpression = /rel=.*original.*/gi
  const moriginalregex = new RegExp(mementoRelOriginalExpression) // Regex to get original

  const mementoRelMementoExpression = /rel=.*memento[^a-zA-Z].*/gi
  const mementoregex = new RegExp(mementoRelMementoExpression) // Regex to get a memento

  const mementoRelSelfExpression = /rel=.*self.*/gi
  const mselfregex = new RegExp(mementoRelSelfExpression) // Regex to get self

  this.mementos = []

  for (let lhe = 0; lhe < linkHeaderEntries.length; lhe++) {
    const partsOfEntry = linkHeaderEntries[lhe].split(';')

    for (let partOfEntry = 0; partOfEntry < partsOfEntry.length; partOfEntry++) {
      if (isValidURL(partsOfEntry[partOfEntry].slice(1, -1))) {
        url = partsOfEntry[partOfEntry]
      }

      /* Splitting into multiple ifs instead of if-else allows for e.g., rel="timegate original" */
      if (partsOfEntry[partOfEntry].match(mtimegateregex)) {
        timegate = url
        if (debug) { console.log('found tg: ' + url) }
      }
      if (partsOfEntry[partOfEntry].match(mtimemapregex)) {
        timemap = url
        if (debug) { console.log('found tm: ' + url) }
      }
      if (partsOfEntry[partOfEntry].match(moriginalregex)) {
        original = url
        if (debug) { console.log('found orig: ' + url) }
      }
      if (partsOfEntry[partOfEntry].match(mselfregex)) {
        self = url
        if (debug) { console.log('found self: ' + url) }
      }
      if (partsOfEntry[partOfEntry].match(mementoregex)) {
        this.mementos.push(new Memento(linkHeaderEntries[lhe] + linkHeaderEntries[lhe + 1]))
      }
    }
  }

  if (timemap) { this.timemap = sanitizeMementoURI(timemap) }
  if (timegate) { this.timegate = sanitizeMementoURI(timegate) }
  if (original) { this.original = sanitizeMementoURI(original) }
  if (self) { this.self = sanitizeMementoURI(self) }

  if (!timemap && !timegate && !original) {
    if (debug) {
      console.log("Link header exists, but we didn't find a timemap, timegate or original value in the header.")
      console.log('link header: ')
      console.log(this.str)
      console.log(linkHeaderEntries)
      console.log(linkHeaderEntries)
    }
  }
}

function Memento (fromStr) {
  this.str = fromStr
  this.first = false
  this.last = false
  this.next = null
  this.prev = null

  if (!fromStr) { return }

  this.uri = this.str.substring(this.str.indexOf('<') + 1, this.str.indexOf('>'))
  this.datetime = this.str.substr(this.str.indexOf('datetime')) // Abbreviation to just include datetime string and on
  this.datetime = this.datetime.substr(this.datetime.indexOf('"')).replace(/"/g, '').trim()

  const mementoRelFirstExpression = /rel=.*first.*/gi
  const mfirstregex = new RegExp(mementoRelFirstExpression) // Regex to get first

  const mementoRelLastExpression = /rel=.*last.*/gi
  const mlastregex = new RegExp(mementoRelLastExpression) // Regex to get last

  const mementoRelNextExpression = /rel=.*next.*/gi
  const mnextregex = new RegExp(mementoRelNextExpression) // Regex to get next

  const mementoRelPrevExpression = /rel=.*prev.*/gi
  const mprevregex = new RegExp(mementoRelPrevExpression) // Regex to get next

  if (fromStr.match(mfirstregex)) {
    this.first = true
  }
  if (fromStr.match(mlastregex)) {
    this.last = true
  }
  if (fromStr.match(mnextregex)) {
    this.next = true
  }
  if (fromStr.match(mprevregex)) {
    this.prev = true
  }
}

/* ***************************
   PUT BELOW IN UTIL.JS
*************************** */

function sanitizeMementoURI (mURI) {
  let ret = mURI.trim()
  if (ret.substr(0, 1) === '<' && ret.substr(ret.length - 1, 1) === '>') {
    ret = ret.substr(1, ret.length - 2) // Remove first and last characters
  }
  return ret
}

this.timemap = Timemap
