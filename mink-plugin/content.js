/* global chrome, $, Timemap */

const debug = false

// var proxy = 'http://timetravel.mementoweb.org/timemap/link/'
// var memgator_proxy = 'http://memgator.cs.odu.edu/timemap/link/'
// var aggregator_wdi_json = 'http://labs.mementoweb.org/timemap/json/'
let memgatorHosts = [
  'https://memgator.cs.odu.edu',
  'https://aggregator.matkelly.com']

// Set aggregators if specified in options
chrome.storage.local.get('aggregators', function (ls) {
  if (ls.aggregators) {
    memgatorHosts = ls.aggregators
  }
})
const memgatorJsonEndpoint = '/timemap/json/'

// var aggregator_wdi_link = 'http://labs.mementoweb.org/timemap/link/'
// var aggregator_diy_link = 'http://timetravel.mementoweb.org/timemap/link/'
// var aggregator_diy_json = 'http://timetravel.mementoweb.org/timemap/json/'

let hostI = 0 // Aggregator host to use, change in fallback

let animateBrowserActionIcon = false
let animationTimer

// TODO: check if in ignore list
// getIgnorelist()

// Faux promises for enabling/disabling UI
const setIgnorelisted = function () { setActiveBasedOnIgnorelistedProperty(displayUIBasedOnContext) }
const setInitialStateWithChecks = function () { setActiveBasedOnDisabledProperty(setIgnorelisted) }

setInitialStateWithChecks()

function log (...messages) {
  if (inDevelopmentMode()) {
    for (const msg of messages) {
      console.log(msg)
    }
    // console.log(new Error().stack)
  }
  // console.trace()
}

function inDevelopmentMode () {
  return !('update_url' in chrome.runtime.getManifest())
}

function logGroup (groupName, ...messages) {
  if (!debug) { return }

  console.group(groupName)
  log(messages)
  console.groupEnd()
}

function setActiveBasedOnDisabledProperty (cb) {
  chrome.storage.local.get('disabled', function (items) {
    if (items.disabled) {
      chrome.runtime.sendMessage({ method: 'stopWatchingRequests' }, function (response) {})
    } else {
      cb()
    }
  })
}

function setActiveBasedOnIgnorelistedProperty (cb) {
  chrome.storage.local.get('ignorelist', function (items) {
    if (!items.ignorelist) {
      cb()
      return
    }

    for (let ii = items.ignorelist.length - 1; ii >= 0; ii--) {
      const documentHostname = (new window.URL(document.URL)).hostname
      const ignorelistEntryHostname = (new window.URL(items.ignorelist[ii])).hostname
      if (documentHostname === ignorelistEntryHostname) {
        chrome.runtime.sendMessage({ method: 'stopWatchingRequestsIgnorelisted' })
        return
      }
    }

    cb()
  })
}

// TODO: refine the acronym in this function's signature. Beware the axe murderer.
function normalDisplayUIBC (items) {
  const hasATimeMapInCache = items.timemaps && items.timemaps[document.URL]

  if (hasATimeMapInCache) {
    const isAMemento = items.timemaps[document.URL].datetime

    if (isAMemento) {
      chrome.runtime.sendMessage({
        method: 'setBadge',
        text: '',
        iconPath: {
          38: chrome.runtime.getURL('images/mLogo38_isAMemento.png'),
          19: chrome.runtime.getURL('images/mLogo19_isAMemento.png')
        }
      })
    } else { // Live web page revisited w/ a TM in cache
      log('Live web page revisited with a TM in cache')

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
    log('Not a memento, no TimeMap in cache')

    log(`Checking if aggregator at ${memgatorHosts[hostI]} is alive`)
    checkAggregatorHealthAndSet(hostI).then(_ => {
      log(`Getting URL ${document.URL} with aggregator ${memgatorHosts[hostI]}`)
      getMementos(document.URL)
    })
  }
}

function checkAggregatorHealthAndSet (aggregatorIndex) {
  if (aggregatorIndex >= memgatorHosts.length) {
    log('Exhausted all aggregators')
    return
  }

  const url = memgatorHosts[aggregatorIndex]
  const timeout = 2000
  const aborter = new window.AbortController()
  const signal = aborter.signal

  const options = { mode: 'no-cors', signal }

  console.log(`Checking the health of aggregator #${aggregatorIndex} at ${memgatorHosts[aggregatorIndex]}`)

  return window.fetch(url, options)
    .then(setTimeout(() => { aborter.abort(`The request to ${url} timed out and has been aborted`) }, timeout))
    .then(() => {
      log(`Aggregator at ${memgatorHosts[aggregatorIndex]} was accessible\nSet as default`)
      // TODO: set as default in the options
      setDefaultAggregator(aggregatorIndex)
    })
    .catch(error => {
      log(`${url} appears to be down, incrementing host counter`)
      log(error)
      hostI += 1
    })
}

function setDefaultAggregator (indexOfNewDefault) {
  chrome.storage.local.get('aggregators', function (ls) {
    log(ls)
    let aggregatorsArray = ls.aggregators
    const newDefault = ls[indexOfNewDefault]
    aggregatorsArray.splice(indexOfNewDefault, 1)
    aggregatorsArray.unshift(newDefault)
    chrome.storage.local.set({ 'aggregators': aggregatorsArray })
  })
}

function displayUIBasedOnContext () {
  log('displayUIBasedOnContext()', document.URL)

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
      log(headers)
      for (let headerI = 0; headerI < headers.length; headerI++) {
        // First line: previously deleting attribute (link header) leaves null
        if (headers[headerI] == null) { continue }
        if (headers[headerI].name.toLowerCase() === 'memento-datetime') {
          mementoDateTimeHeader = headers[headerI].value
        } else if (headers[headerI].name.toLowerCase() === 'link') {
          linkHeaderAsString = headers[headerI].value
        }
      }
      let tm
      if (!linkHeaderAsString && !mementoDateTimeHeader) { // Case 1
        normalDisplayUIBC(items)
        log('No linkheader and no memento date time header')
      } else if (linkHeaderAsString && !mementoDateTimeHeader) { // Case 2
        logGroup('Headers Present', '✅ Link', '❌ Memento-Datetime')

        if (notStoredInCache) {
          let specifiedTimegate = false
          let specifiedTimemap = false
          log('Adding Link header specified to cache')

          tm = new Timemap(linkHeaderAsString)

          log(`TimeGate header value: ${tm.timegate}`)

          if (tm.timegate) { // Specified own TimeGate, query this
            logGroup('Headers Present', '✅ TimeGate')

            specifiedTimegate = true

            chrome.runtime.sendMessage({
              method: 'findTMURI', timegate: tm.timegate
            })
          }

          if (tm.timemap && !specifiedTimegate) { // e.g., w3c wiki
            logGroup('Headers Present', '✅ TimeMap', '❌ TimeGate')

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

          log('Case 3: Link header and datetime', tm)

          chrome.runtime.sendMessage({
            method: 'setTimemapInStorageAndCall', tm, url: document.URL
          })
        } else {
          log('Case 3: Link header, datetime in cache')

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
  log('displayUIBasedOnStoredTimeMap()')
  chrome.runtime.sendMessage({
    method: 'setTMData',
    value: tmDataIn
  })

  log(tmDataIn)
  const mementoCountFromCache = tmDataIn.mementos.list.length
  chrome.runtime.sendMessage({ method: 'setBadgeText', value: '' + mementoCountFromCache })
}

function getIgnorelist (cb) {
  const callbackArguments = arguments
  chrome.storage.local.get('ignorelist', function (items) {
    log('Current ignore list: ', items)

    if (!cb) {
      log('no callback specified for getIgnorelist();')
      return
    }

    cb(items, callbackArguments[1])
  })
}

function addToIgnorelist (currentIgnorelist, uriIn) {
  const uri = uriIn
  const save = {
    ignorelist: null
  }

  if ($.isEmptyObject(currentIgnorelist)) {
    save.ignorelist = []
  } else {
    save.ignorelist = currentIgnorelist.ignorelist
  }

  if (!save.ignorelist) {
    save.ignorelist = []
  }

  // TODO (#191): Normalize uriIn?

  // Check if URI is already in ignore list before adding
  if (save.ignorelist.indexOf(uriIn) > -1) {
    log('URI already in ignorelist', save.ignorelist)

    return
  }

  log('Previous ignore list contents:', save.ignorelist)
  save.ignorelist.push(uriIn)
  log('Current ignore list contents:', save.ignorelist)

  chrome.storage.local.set(save,
    function () {
      log(`Done adding ${uri} to ignore list. Prev ignore list:`, currentIgnorelist)

      getIgnorelist()
    }
  )
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  log(`in listener with ${request.method}`)

  if (request.method === 'tryNextAggregator') {
    ++hostI
    checkAggregatorHealthAndSet(hostI)
    console.log(`trying again with aggregator ${hostI}`)
    getMementos(request.uri)
    return
  }

  if (request.method === 'addToIgnorelist') {
    getIgnorelist(addToIgnorelist, request.uri) // And add uri
    return
  }

  if (request.method === 'stopAnimatingBrowserActionIcon') {
    // Stopping the browser action icon animation
    clearTimeout(animationTimer)
    animateBrowserActionIcon = false
    return
  }

  if (request.method === 'displayUIStoredTM') {
    log('got message displayUIStoredTM()')

    displayUIBasedOnStoredTimeMap(request.data)
  }

  if (request.method === 'startTimer') {
    chrome.runtime.sendMessage({
      method: 'setBadge',
      text: '',
      iconPath: {
        38: clockIcons38[clockIcons38.length - 1],
        19: clockIcons19[clockIcons19.length - 1]
      }
    })
    chrome.runtime.sendMessage({ method: 'setBadgeText', text: '' }, function (response) {
    })
    animateBrowserActionIcon = true
    setTimeout(animatePageActionIcon, 500)
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
        log('We have a response!') // This will not occur due to async exec in mink.js
      })
    }
    return
  }

  if (request.method === 'displayUI') {
    log(request.timegate, request.timemap, request.uri, '-----', 'no special handling, calling fallthrough')

    displayUIBasedOnContext()
  }

  if (request.method === 'showViewingMementoInterface') {
    log('We will show the "return to live web" interface but it is not implemented yet')
  }

  if (request.method === 'clearLinkHeaderAndDisplayUI') {
    // This occurs when a previous attempt to fetch a TimeGate specified in a Link header fails but allows
    // some functionality to proceed instead of failing hard. See #308
    chrome.storage.local.get('headers', function (storedHeaders) {
      let headers = storedHeaders.headers[document.URL]
      console.log(storedHeaders)
      for (let header in headers) {
        if (headers[header].name.toUpperCase() === 'LINK') {
          delete headers[header]
          break
        }
      }
      storedHeaders.headers[document.URL] = headers
      console.log(storedHeaders)

      chrome.storage.local.set(storedHeaders, displayUIBasedOnContext)
    })
  }

  if (request.method === 'setDefaultAggregators') {
    console.log('TODO: set default aggregators from content.js')
  }
})

function getMementos (uri) {
  log('getMementosWithTimemap()')
  const timemapLocation = `${memgatorHosts[hostI]}${memgatorJsonEndpoint}${uri}`

  chrome.runtime.sendMessage({
    method: 'setBadge',
    text: '',
    iconPath: {
      38: clockIcons38[clockIcons38.length - 1],
      19: clockIcons19[clockIcons19.length - 1]
    }
  })

  chrome.runtime.sendMessage({ method: 'setBadgeText', text: '' }, function (response) {})

  animateBrowserActionIcon = true

  setTimeout(animatePageActionIcon, 500)

  log(`in getMementos, sending "fetchTimeMap" message to service worker using ${timemapLocation}`)
  chrome.runtime.sendMessage({
    method: 'fetchTimeMap',
    value: timemapLocation,
    urir: uri
  })
}

const clockIcons38 = [chrome.runtime.getURL('images/mementoLogos/mLogo38_7.5.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo38_15.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo38_22.5.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo38_30.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo38_37.5.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo38_45.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo38_52.5.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo38_60.png')]
const clockIcons19 = [chrome.runtime.getURL('images/mementoLogos/mLogo19_7.5.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo19_15.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo19_22.5.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo19_30.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo19_37.5.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo19_45.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo19_52.5.png'),
  chrome.runtime.getURL('images/mementoLogos/mLogo19_60.png')]
let iteration = clockIcons38.length - 1

function animatePageActionIcon () {
  if (!animateBrowserActionIcon) {
    clearTimeout(animationTimer)
    return
  }

  chrome.runtime.sendMessage({
    method: 'setBadge',
    text: '',
    iconPath: { '38': clockIcons38[iteration], '19': clockIcons19[iteration] }
  })
  iteration--

  if (iteration < 0) { iteration = clockIcons38.length - 1 }
  animationTimer = setTimeout(animatePageActionIcon, 250)
  // TODO: know when to stop this
}
