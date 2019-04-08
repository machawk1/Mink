/* global chrome, $, Timemap */

let debug = true

// var proxy = 'http://timetravel.mementoweb.org/timemap/link/'
// var memgator_proxy = 'http://memgator.cs.odu.edu/timemap/link/'
// var aggregator_wdi_json = 'http://labs.mementoweb.org/timemap/json/'
const memgatorJson = 'https://memgator.cs.odu.edu/timemap/json/'

// var aggregator_wdi_link = 'http://labs.mementoweb.org/timemap/link/'
// var aggregator_diy_link = 'http://timetravel.mementoweb.org/timemap/link/'
// var aggregator_diy_json = 'http://timetravel.mementoweb.org/timemap/json/'

let animateBrowserActionIcon = false
let animationTimer

// TODO: check if in blacklist
// getBlacklist()

// Faux promises for enabling/disabling UI
let setBlacklisted = function () { setActiveBasedOnBlacklistedProperty(displayUIBasedOnContext) }
const setInitialStateWithChecks = function () { setActiveBasedOnDisabledProperty(setBlacklisted) }

setInitialStateWithChecks()

function setActiveBasedOnDisabledProperty (cb) {
  chrome.storage.local.get('disabled', function (items) {
    if (items.disabled) {
      chrome.runtime.sendMessage({ method: 'stopWatchingRequests' }, function (response) {})
    } else {
      cb()
    }
  })
}

function setActiveBasedOnBlacklistedProperty (cb) {
  chrome.storage.local.get('blacklist', function (items) {
    if (!items.blacklist) {
      cb()
      return
    }

    for (let ii = items.blacklist.length - 1; ii >= 0; ii--) {
      const documentHostname = (new window.URL(document.URL)).hostname
      const blacklistEntryHostname = (new window.URL(items.blacklist[ii])).hostname
      if (documentHostname === blacklistEntryHostname) {
        chrome.runtime.sendMessage({ method: 'stopWatchingRequestsBlacklisted' })
        return
      }
    }

    cb()
  })
}

function normalDisplayUIBC (items) {
  const hasATimeMapInCache = items.timemaps && items.timemaps[document.URL]

  if (hasATimeMapInCache) {
    const isAMemento = items.timemaps[document.URL].datetime

    if (isAMemento) {
      chrome.runtime.sendMessage({
        method: 'setBadge',
        text: '',
        iconPath: {
          '38': chrome.extension.getURL('images/mLogo38_isAMemento.png'),
          '19': chrome.extension.getURL('images/mLogo19_isAMemento.png')
        }
      })
    } else { // Live web page revisited w/ a TM in cache
      if (debug) {
        console.log('Live web page revisited with a TM in cache')
      }

      if (!items.timemaps[document.URL].timemap && items.timemaps[document.URL].timegate &&
        items.timemaps[document.URL].mementos && items.timemaps[document.URL].mementos.length === 0) {
        // DBPedia specifies its own TG but lists no mementos/TM
        getTMThenCall(document.URL, function () {
          displayUIBasedOnStoredTimeMap(items.timemaps[document.URL])
        })
      } else {
        displayUIBasedOnStoredTimeMap(items.timemaps[document.URL])
      }
    }
  } else { // Not a Memento, no TM in cache
    if (debug) {
      console.log('not a memento, no TM in cache')
    }
    getMementos(document.URL)
  }
}

function displayUIBasedOnContext () {
  if (debug) {
    console.log('displayUIBasedOnContext()')
    console.log(document.URL)
  }
  chrome.storage.local.get('headers', function (itemsh) {
    chrome.storage.local.get('timemaps', function (items) {
      const headers = itemsh.headers[document.URL]
      let mementoDateTimeHeader
      let linkHeaderAsString
      const notStoredInCache = Object.keys(items).length === 0 || !items.timemaps.hasOwnProperty(document.URL)
      /*
       special consideration deets.tabId will be -1 if the request is not related to a tab
       case 1: no link header, no datetime
       case 2: link header, no datetime
       case 3: link header, datetime
       */
      for (let headerI = 0; headerI < headers.length; headerI++) {
        if (headers[headerI].name.toLowerCase() === 'memento-datetime') {
          mementoDateTimeHeader = headers[headerI].value
        } else if (headers[headerI].name.toLowerCase() === 'link') {
          linkHeaderAsString = headers[headerI].value
        }
      }
      let tm
      if (!linkHeaderAsString && !mementoDateTimeHeader) { // Case 1
        normalDisplayUIBC(items)
        if (debug) {
          console.log('No linkheader and no memento date time header')
        }
      } else if (linkHeaderAsString && !mementoDateTimeHeader) { // Case 2
        if (debug) {
          console.log(' linkheader and no memento date time header')
        }
        if (notStoredInCache) {
          let specifiedTimegate = false
          let specifiedTimemap = false
          if (debug) {
            console.log('case 2 not in cache putting link header specified into cache')
          }
          tm = new Timemap(linkHeaderAsString)

          if (debug) {
            console.log('TG?: ' + tm.timegate)
          }
          if (tm.timegate) { // Specified own TimeGate, query this
            if (debug) {
              console.log('Specified Timegate')
            }
            specifiedTimegate = true

            chrome.runtime.sendMessage({
              method: 'findTMURI', timegate: tm.timegate
            })
          }

          if (tm.timemap && !specifiedTimegate) { // e.g., w3c wiki
            if (debug) {
              console.log('time map and no timegate')
            }

            chrome.runtime.sendMessage({
              method: 'fetchTimeMap', value: tm.timemap
            })
            specifiedTimemap = true
          }

          if (!specifiedTimegate && !specifiedTimemap) {
            // Case for when there is a link but nothing about memento is there
            normalDisplayUIBC(items)
          }
        } else {
          normalDisplayUIBC(items)
        }
      } else if (mementoDateTimeHeader) { // Case 3
        if (notStoredInCache) {
          tm = new Timemap(linkHeaderAsString)
          tm.datetime = mementoDateTimeHeader
          if (debug) {
            console.log('case 3: link header, datetime')
            console.log(tm)
          }
          chrome.runtime.sendMessage({
            method: 'setTimemapInStorageAndCall', tm: tm, url: document.URL
          })
        } else {
          if (debug) {
            console.log('case 3: link header, datetime in cache')
          }
          normalDisplayUIBC(items)
        }
      }
    })
  })
}

function getTMThenCall (uri, cb) {
  $.ajax({
    url: uri
  }).done(function (data, textStatus, xhr) {
    let tm = new Timemap(xhr.getResponseHeader('Link'))
    if (tm.timemap) {
      chrome.runtime.sendMessage({
        method: 'fetchTimeMap',
        value: tm.timemap
      }, cb)
      return
    }

    if (tm.mementos && tm.mementos.length < 3 && tm.timegate) {
      const nextURI = tm.timegate
      tm = null
      getTMThenCall(nextURI, cb)
    } else {
      cb()
    }
  })
}

function displayUIBasedOnStoredTimeMap (tmDataIn) {
  if (debug) { console.log('displayUIBasedOnStoredTimeMap') }
  chrome.runtime.sendMessage({
    method: 'setTMData',
    value: tmDataIn
  })

  if (debug) { console.log(tmDataIn) }
  const mementoCountFromCache = tmDataIn.mementos.list.length
  chrome.runtime.sendMessage({ method: 'setBadgeText', value: '' + mementoCountFromCache })
}

function getBlacklist (cb) {
  const callbackArguments = arguments
  chrome.storage.local.get('blacklist', function (items) {
    if (debug) {
      console.log('Current blacklist: ')
      console.log(items)
    }

    if (!cb) {
      if (debug) { console.log('no callback specified for getBlacklist();') }
      return
    }

    cb(items, callbackArguments[1])
  })
}

function addToBlacklist (currentBlacklist, uriIn) {
  const uri = uriIn
  let save = {
    'blacklist': null
  }

  if ($.isEmptyObject(currentBlacklist)) {
    save.blacklist = []
  } else {
    save.blacklist = currentBlacklist.blacklist
  }

  if (!save.blacklist) {
    save.blacklist = []
  }

  // TODO (#191): Normalize uriIn?

  // Check if URI is already in blacklist before adding
  if (save.blacklist.indexOf(uriIn) > -1) {
    if (debug) {
      console.log('URI already in blacklist')
      console.log(save.blacklist)
    }
    return
  }

  if (debug) {
    console.log('Previous blacklist contents:')
    console.log(save.blacklist)
  }

  save.blacklist.push(uriIn)

  if (debug) {
    console.log('Current blacklist contents:')
    console.log(save.blacklist)
  }

  chrome.storage.local.set(save,
    function () {
      if (debug) {
        console.log('done adding ' + uri + ' to blacklist. Prev blacklist:')
        console.log(currentBlacklist)
      }
      getBlacklist()
    }
  )
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (debug) { console.log('in listener with ' + request.method) }

  if (request.method === 'addToBlacklist') {
    getBlacklist(addToBlacklist, request.uri) // And add uri
    return
  }

  if (request.method === 'stopAnimatingBrowserActionIcon') {
    clearTimeout(animationTimer)
    animateBrowserActionIcon = false
    return
  }

  if (request.method === 'displayUIStoredTM') {
    if (debug) {
      console.log('got message displayUIStoredTM')
    }
    displayUIBasedOnStoredTimeMap(request.data)
  }

  if (request.method === 'startTimer') {
    if (debug) {
      console.log('Got startTimer')
    }
    chrome.runtime.sendMessage({
      method: 'setBadge',
      text: '',
      iconPath: {
        '38': clockIcons38[clockIcons38.length - 1],
        '19': clockIcons19[clockIcons19.length - 1]
      }
    })
    chrome.runtime.sendMessage({ method: 'setBadgeText', text: '' }, function (response) {
    })
    animateBrowserActionIcon = true
    setTimeout(animatePageActionIcon, 500)
  }

  if (request.method === 'stopAnimatingBrowserActionIcon') {
    clearTimeout(animationTimer)
    animateBrowserActionIcon = false
    return
  }

  if (request.method === 'showArchiveNowUI') {
    return
  }

  if (request.method === 'displayThisMementoData') {
    // Parse the data received from the secure source and display the number of mementos
    if (request.data.timemap_uri) { // e.g., twitter.com
      chrome.runtime.sendMessage({
        method: 'fetchSecureSitesTimeMap',
        value: request.data.timemap_uri.json_format
      }, function (response) {
        if (debug) { console.log('We have a response!') } // This will not occur due to async exec in mink.js
      })
      return
    }
    return
  }

  if (request.method === 'displayUI') {
    if (debug) {
      console.log(request.timegate)
      console.log(request.timemap)
      console.log(request.uri)
      console.log('-----')
      console.warn('no special handling, calling fallthrough')
      // displayUIBasedOnContext()
    }

    displayUIBasedOnContext()
  }

  if (request.method === 'showViewingMementoInterface') {
    if (debug) {
      console.log('We will show the "return to live web" interface but it is not implemented yet')
    }
  }
})

function getMementos (uri) {
  if (debug) { console.log('getMementosWithTimemap()') }
  const timemapLocation = memgatorJson + uri

  chrome.runtime.sendMessage({ method: 'setBadge',
    text: '',
    iconPath: {
      '38': clockIcons38[clockIcons38.length - 1],
      '19': clockIcons19[clockIcons19.length - 1]
    }
  })

  chrome.runtime.sendMessage({ method: 'setBadgeText', text: '' }, function (response) {})

  animateBrowserActionIcon = true

  setTimeout(animatePageActionIcon, 500)

  if (debug) { console.log('in getMementos, sending "fetchTimeMap" message') }
  chrome.runtime.sendMessage({
    method: 'fetchTimeMap',
    value: timemapLocation
  })
}

const clockIcons38 = [chrome.extension.getURL('images/mementoLogos/mLogo38_7.5.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo38_15.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo38_22.5.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo38_30.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo38_37.5.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo38_45.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo38_52.5.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo38_60.png')]
const clockIcons19 = [chrome.extension.getURL('images/mementoLogos/mLogo19_7.5.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo19_15.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo19_22.5.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo19_30.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo19_37.5.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo19_45.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo19_52.5.png'),
  chrome.extension.getURL('images/mementoLogos/mLogo19_60.png')]
let iteration = clockIcons38.length - 1

function animatePageActionIcon () {
  if (!animateBrowserActionIcon) {
    clearTimeout(animationTimer)
    return
  }
  chrome.runtime.sendMessage({
    method: 'setBadge',
    text: '',
    iconPath: { '38': clockIcons38[iteration], '19': clockIcons19[iteration] } })
  iteration--

  if (iteration < 0) { iteration = clockIcons38.length - 1 }
  animationTimer = setTimeout(animatePageActionIcon, 250)
  // TODO: know when to stop this
}
