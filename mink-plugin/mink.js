/* global chrome, $, Timemap */

const debug = false
let tmData
const maxBadgeDisplay = '> 1k'
const stillProcessingBadgeDisplay = 'WAIT'

const browserActionTitleViewingMemento = 'Mink - Viewing Memento'
const browserActionTitleNormal = 'Mink - Integrating the Live and Archived Web'
const browserActionTitleNoMementos = 'Mink - No Mementos Available'
const browserActionTitleIgnorelisted = 'Mink - Viewing Ignored Site'

const badgeImagesDisabled = {
  38: chrome.runtime.getURL('images/minkLogo38_disabled.png'),
  19: chrome.runtime.getURL('images/minkLogo19_disabled.png')
}

const badgeImagesIgnorelisted = {
  38: chrome.runtime.getURL('images/minkLogo38_ignorelisted.png'),
  19: chrome.runtime.getURL('images/minkLogo19_ignorelisted.png')
}

const badgeImagesNoMementos = {
  38: chrome.runtime.getURL('images/minkLogo38_noMementos2.png'),
  19: chrome.runtime.getURL('images/minkLogo19_noMementos2.png')
}

const badgeImagesMink = {
  38: chrome.runtime.getURL('images/minkLogo38.png'),
  19: chrome.runtime.getURL('images/minkLogo19.png')
}

const badgeImagesIsAMemento = {
  38: chrome.runtime.getURL('images/mLogo38_isAMemento.png'),
  19: chrome.runtime.getURL('images/mLogo19_isAMemento.png')
}

function log (...messages) {
  if (inDevelopmentMode()) {
    for (const msg of messages) {
      console.log(msg)
    }
  }
}

function logWithTrace (...messages) {
  log(...messages)
  console.log('Stack Trace:')
  console.log(new Error().stack)
  console.trace()
}

function inDevelopmentMode () {
  return !('update_url' in chrome.runtime.getManifest())
}

chrome.action.onClicked.addListener(function (tab) {
  const scheme = (new URL(tab.url)).origin.substr(0, 4)
  if (scheme !== 'http') {
    log(`Invalid scheme for Mink: ${scheme}`)
    return
  }

  // Check if isA Memento
  chrome.storage.local.get('timemaps', function (items) {
    if (items.timemaps && items.timemaps[tab.url]) {
      log('Clicked button and we are viewing a XXX')
      displayMinkUI(tab.id, items.timemaps[tab.url])
    } else {
      log(`No timemap stored in cache for ${tab.url}`)
      showMinkBadgeInfoBasedOnProcessingState(tab.id)
    }
  })
})

function setEnabledBasedOnURIInIgnorelist (cb) {
  chrome.tabs.query({ active: true }, function (tab) {
    log('is URI in ignore list?', tab)

    if (cb) { cb() }
  })
}

function showMinkBadgeInfoBasedOnProcessingState (tabid) {
  chrome.storage.local.get('disabled', function (items) {
    if (items.disabled) {
      stopWatchingRequests()
      // TODO: show alternate interface
      return
    }

    const cb = function () { setBadgeTextBasedOnBrowserActionState(tabid) }

    // TODO: check if URI is in ignore list
    log('about to call setEnabledBasedOnURIIgnorelist')
    setEnabledBasedOnURIInIgnorelist(cb)
  })
}

function setBadgeTextBasedOnBrowserActionState (tabid) {
  // TODO: This should not rely on the badge count to detect zero mementos, as badges
  //  are no longer used for no mementos present.
  // - maybe rely on the title, since the icon's src path cannot be had.
  chrome.action.getBadgeText({ tabId: tabid }, function (result) {
    if (!result.length && !Number.isInteger(result) && result !== maxBadgeDisplay) {
      chrome.action.getTitle({ tabId: tabid }, function (result) {
        // Only set badge text if not viewing a memento
        if (result === browserActionTitleNoMementos) {
          displayMinkUI(tabid)
          return
        }

        if (result === browserActionTitleIgnorelisted) {
          return // Prevent the below WAIT message from appearing if b-listed
        }

        if (result !== browserActionTitleViewingMemento) {
          setBadgeText(stillProcessingBadgeDisplay, tabid)
        } else {
          console.log('Show "Viewing Memento" Mink UI in page content.')
          displayMinkUI(tabid)
        }
      })

      log('Badge has not been seen yet')
      return // Badge has not yet been set
    }

    chrome.action.getBadgeText({ tabId: tabid }, function (currentBadgeText) {
      if (currentBadgeText !== stillProcessingBadgeDisplay) {
        displayMinkUI(tabid)
      }
    })
  })
}

function displayMinkUI (tabId, tmData) {
  log('Injecting displayMinkUI.js')
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['js/displayMinkUI.js']
  }, () => {
    log('done executing script, sending message')
    chrome.tabs.sendMessage(tabId, {
      tmData: tmData
    })
  })
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.method === 'store') {
      chrome.storage.local.set({
        'minkURI': request.value,
        'mementos': request.memento,
        'memento_datetime': request.memento_datetime
      }).then(() => {
        if (debug) {
          console.log('sw local storage set')
        }

        sendResponse({ value: 'noise' })
      })
    } else if (request.method === 'findTMURI') {
      log('Got findTMURI')
      findTMURI(request.timegate, sender.tab.id)
    } else if (request.method === 'setTimemapInStorageAndCall') {
      log('Got setTimemapInStorageAndCall')
      setTimemapInStorageAndCall(request.tm, request.url, function () {
        chrome.tabs.sendMessage(sender.tab.id, {
          method: 'displayUI'
        })
      })
    } else if (request.method === 'retrieve') {
      log('Retrieving items from localStorage')
      // See https://developer.chrome.com/docs/extensions/reference/storage/#property-local
      const keysFromLS = ['minkURI', 'mementos', 'memento_datetime']

      // MV3 is a good thing. MV3 is a good thing. MV3 is a good thing.
      chrome.storage.local.get([keysFromLS[0], keysFromLS[1], keysFromLS[2]],
          (valuesFromLS) => {
            sendResponse({
              value: valuesFromLS[keysFromLS[0]],
              mementos: valuesFromLS[keysFromLS[1]],
              memento_datetime: valuesFromLS[keysFromLS[2]]
            })
          }
      )

      // sendResponse({
      //  value: window.localStorage.getItem('minkURI'),
      //  mementos: window.localStorage.getItem('mementos'),
      //  memento_datetime: window.localStorage.getItem('memento_datetime')
      // })
    } else if (request.method === 'fetchTimeMap') {
      fetchTimeMap(request.value, sender.tab.id, request.urir)
    } else if (request.method === 'notify') {
      chrome.notifications.create(
        'id1', {
          type: 'basic',
          title: request.title,
          message: request.body,
          iconUrl: 'images/mink_marvel_128.png'
        })
    } else if (request.method === 'setBadgeText') {
      setBadgeText(request.value, sender.tab.id)
      sendResponse({
        value: 'stopAnimation'
      })
    } else if (request.method === 'setDropdownContents' || request.method === 'setTMData') {
      tmData = request.value
    } else if (request.method === 'setBadge') {
      setBadge(request.text, request.iconPath, sender.tab.id)
    } else if (request.method === 'openOptionsPage') {
      log('Opening options page')
      chrome.runtime.openOptionsPage()
    } else if (request.method === 'stopWatchingRequests') {
      stopWatchingRequests()
    } else if (request.method === 'stopWatchingRequestsIgnorelisted') {
      stopWatchingRequestsIgnorelisted()
    } else if (request.method === 'getMementosForHTTPSSource') {
      // Ideally, we would talk to an HTTPS version of the aggregator,
      // Instead, we will communicate with Mink's bg script to get around scheme issue
      const uri = `http${request.value.substr(4)}`

      $.ajax({
        url: uri,
        type: 'GET'
      }).done(function (data, textStatus, xhr) {
        log('We should parse and return the mementos here via a response')

        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            method: 'displayThisMementoData',
            data: data
          })
        })
      }).fail(function (xhr, textStatus, error) {
        if (error === 'Not Found') {
          showArchiveNowUI()
        }
      })
    } else if (request.method === 'archive') {
      // Prepend based on archive destination
      let submissionURI
      let data = {}
      let method = 'GET'
      if (request.archive === 'ia') {
        submissionURI = `http://web.archive.org/save/${request.urir}`
        method = 'GET'
      } else if (request.archive === 'ais') {
        // TODO: get value of submitid from AIS interface
        submissionURI = 'archive.is/submit/'
        method = 'POST'
        data = {coo: '', url: request.urir}
      }

      // TODO: XHR to fetch for MV3 implementation incomplete below
      (async function () {
        const resp = await fetch(submissionURI)
        changeArchiveIcon(request, response)
      })
    } else {
      log(`Message sent using chrome.runtime not caught: ${request.method}`)
    }
  }
)

function changeArchiveIcon (request, response) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      method: 'archiveDone',
      data: response.url,
      imgId: request.imgId,
      imgURI: request.imgURI,
      callback: request.cb,
      newTab: request.newTab
    })
  })
}

class InaccessibleAggregator extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
  }
}

class ZeroMementos extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
  }
}
async function fetchTimeMap (uri, tabid, urir) {
  log(`Fetching TimeMap for ${uri} in tab ${tabid}`)

  fetch(uri)
      .then(response => {
        log('Fetch responses received, proceeding')
        const status_code = response.status
        if (status_code == 404) {
          throw new ZeroMementos(`No mementos for {uri}`)
        } else if (status_code == 504) {
          throw new InaccessibleAggregator(`Aggregator at {uri} reported a {status_code} status code`)
        } else {
          log(`Status code: ${status_code}`)
        }
        return response
      })
      .then(response => {
        return response.json()
      })
      .then(data => {
        log(data)
        if (!data.mementos) {
          data = new Timemap(data)
          // TODO: data.normalize()
          const mems = data.mementos
          delete data.mementos
          data.mementos = { list: mems }
          log(data)
        }
        displaySecureSiteMementos(data.mementos.list, tabid)

        data.original = data.original ? data.original : data.original_uri
        setTimemapInStorage(data, data.original)
      })
      .catch(function(err) {
        logWithTrace(`Something with the response from ${uri} is not as expected...`)

        if (err.name === 'ZeroMementos') {
          showInterfaceForZeroMementos(tabid)
        } else if (err.name === 'InaccessibleAggregator') {
          logWithTrace('TODO: switch up the aggregator')
        } else if (err instanceof SyntaxError) {
          logWithTrace("JSON parsing failed, switch up the aggregator")
          log(`Previous aggregator endpoint: ${uri}`)
          // TODO: obtain URI-R here (don't parse it from URI-T) to send as a param
          chrome.tabs.sendMessage(tabid, {
            method: 'tryNextAggregator',
            uri: urir})
        }
      })
/*
    setTimemapInStorage(tmData, data.original)
    log('Some error occurred with a secure site that was not a 404', xhr)
  }).always(function () {
    chrome.tabs.sendMessage(tabid, {
      method: 'stopAnimatingBrowserActionIcon'
    })
  })

 */
}


function setBadgeText (value, tabid) {
  let badgeValue = value

  if (parseInt(badgeValue, 10) > 999) {
    badgeValue = maxBadgeDisplay
  }

  let badgeColor = '#080'
  if (value === stillProcessingBadgeDisplay) {
    badgeColor = '#800'
  }

  if (!badgeValue) {
    badgeValue = ''
  }

  chrome.action.setBadgeText({ text: badgeValue + '', tabId: tabid })
  chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: tabid })
}

function setBadgeTitle (newTitle, tabid) {
  log('Setting badge title')
  chrome.action.setTitle({ title: newTitle, tabId: tabid })
}

function setBadgeIcon (icons, tabid) {
  chrome.action.setIcon({ tabId: tabid, path: icons })
}

function setBadge (value, icon, tabid) {
  if (value === '') {
    chrome.action.getBadgeText({ tabId: tabid }, function (currentBadgeText) {
      setBadgeText(currentBadgeText + '', tabid)
    })
  } else {
    setBadgeText(value + '', tabid)
  }

  setBadgeIcon(icon, tabid)

  if (JSON.stringify(icon) === JSON.stringify(badgeImagesIsAMemento)) {
    chrome.action.setTitle({ title: browserActionTitleViewingMemento })
  } else {
    chrome.action.setTitle({ title: browserActionTitleNormal })
  }
}

chrome.tabs.onActivated.addListener(function (activeTabInfo) {
  chrome.storage.local.get('disabled', function (items) {
    if (items.disabled) {
      stopWatchingRequests()
    }
  })
})

function startWatchingRequests () {
  chrome.storage.local.remove('disabled', function () {
    chrome.contextMenus.update('mink_stopStartWatching', {
      title: 'Stop Watching Requests',
      onclick: stopWatchingRequests
    })

    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tab) {
      setBadge('', badgeImagesMink, tab[0].id)
      setBadgeText('', tab[0].id)
    })
  })
}

function stopWatchingRequests () {
  log('stopWatchingRequests() executing')
  chrome.storage.local.set({ 'disabled': true }, function () {
    chrome.contextMenus.update('mink_stopStartWatching', {
      title: 'Restart Live-Archived Web Integration',
      onclick: startWatchingRequests
    })

    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tab) {
      setBadge(' ', badgeImagesDisabled, tab[0].id)
      setBadgeText('', tab[0].id)
    })
  })
}

function stopWatchingRequestsIgnorelisted () {
  log('stopWatchingRequestsIgnorelisted() executing')

  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tab) {
    setBadge(' ', badgeImagesIgnorelisted, tab[0].id)
    setBadgeText('', tab[0].id)
    setBadgeTitle(browserActionTitleIgnorelisted, tab[0].id)
  })
}

chrome.contextMenus.onClicked.addListener(stopWatchingRequests) /*{
//  id: 'mink_stopStartWatching',
//  title: 'Stop Watching Requests',
//  contexts: ['browser_action'],
  onclick: stopWatchingRequests
}, function (err) {
  if (err) { console.log('error creating second contextmenu') }
})*/

chrome.contextMenus.onClicked.addListener (addToIgnoreList)
/*create({
  id: 'mink_addURLToIgnoreList',
  title: 'Add URL to Mink Ignore List',
  contexts: ['browser_action', 'all'],
  onclick: addToIgnoreList
})*/

function addToIgnoreList () {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      method: 'addToIgnorelist',
      uri: tabs[0].url
    })

    setBadgeIcon(badgeImagesIgnorelisted, tabs[0].id)
    setBadgeText('', tabs[0].id)
    setBadgeTitle(browserActionTitleIgnorelisted, tabs[0].id)
  })
}

function showArchiveNowUI () {
  log('Showing archive now ui')
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      method: 'showArchiveNowUI'
    })
  })
}

chrome.webRequest.onCompleted.addListener(function (deets) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      method: 'displayUI'
    })
  })
},
{ urls: ['*://twitter.com/*/status/*'], types: ['xmlhttprequest'] }, ['responseHeaders'])

chrome.webRequest.onHeadersReceived.addListener(function (deets) {
  chrome.storage.local.get('headers', function (items) {
    let data
    if (!items.headers) {
      data = {}
    } else {
      data = items.headers
    }

    if (items.headers) {
      const cachedTMKeys = Object.keys(items.headers)
      if (cachedTMKeys.length > 10) { // Keep the cache to a reasonable size through random deletion
        log('******* Number of cached URL Headers:')
        const indexToRemove = Math.floor(Math.random() * cachedTMKeys.length)
        const keyOfIndex = cachedTMKeys[indexToRemove]
        delete data[keyOfIndex]
      }
    }

    data[deets.url] = deets.responseHeaders
    chrome.storage.local.set({ headers: data }, function () {
      if (chrome.runtime.lastError) {
        log(`There was an error last time we tried to store a memento ${chrome.runtime.lastError.message}`)
        if (chrome.runtime.lastError.message.indexOf('QUOTA_BYTES_PER_ITEM') > -1) {
          // LocalStorage is full. Clear it again!
          chrome.storage.local.clear()
        }
      }
    })
  })
},
{ urls: ['<all_urls>'], types: ['main_frame'] }, ['responseHeaders'])

function createTimemapFromURI (uri, tabId, accumulatedArrayOfTimemaps) {
  log('createTimemapFromURI() - includes write to localstorage', accumulatedArrayOfTimemaps)

  // The initial call of this function makes this null
  if (!accumulatedArrayOfTimemaps) {
    accumulatedArrayOfTimemaps = []
  }

  $.ajax({
    url: uri,
    type: 'GET' /* asking for json for mementoweb fails every time */
  }).done(function (data, textStatus, xhr) {
    if (xhr.status === 200) {
      // Make the TimeMap
      const tm = new Timemap(data)
      const mementosFromTimeMap = tm.mementos
      tm.mementos = null
      tm.mementos = {}
      tm.mementos.list = mementosFromTimeMap

      if (tm.timemap && tm.self && tm.timemap !== tm.self && !tmInList(tm.timemap, accumulatedArrayOfTimemaps)) { // Paginated TimeMaps likely
        // Recursing to find more TMs
        log(accumulatedArrayOfTimemaps)

        return createTimemapFromURI(tm.timemap, tabId, accumulatedArrayOfTimemaps.concat(tm))
      } else {
        // Create single timemap from original
        accumulatedArrayOfTimemaps.push(tm) // Add final timemap
        const firstTm = accumulatedArrayOfTimemaps[0] // Get the first one

        // For all other tm, add them to the firsts list
        accumulatedArrayOfTimemaps.slice(1, accumulatedArrayOfTimemaps.length).forEach(function (elem) {
          firstTm.mementos.list = firstTm.mementos.list.concat(elem.mementos.list)
        })
        log('tm.timemap && tm.self.... else ', `First TimeMap ${firstTm}`,
          `First TimeMap ${firstTm.original}`, accumulatedArrayOfTimemaps)

        // Put them in the cache and tell content to display the ui
        setTimemapInStorage(firstTm, firstTm.original)
        // Send two messages first stop animation then display stored
        // If use displayUIBasedOnContext the correctly gotten items will not be display
        // Rather we will ask memgator.cs for mementos
        chrome.tabs.sendMessage(tabId, { method: 'stopAnimatingBrowserActionIcon' })
        chrome.tabs.sendMessage(tabId, {
          method: 'displayUIStoredTM',
          data: firstTm
        })
      }
    }
  })
}

// e.g., http://ws-dl-05.cs.odu.edu/demo-headers/index.php/Seven_Kingdoms
function displayMementosMissingTM (mementos, urir, tabId) {
  const tm = new Timemap()
  tm.mementos = { list: mementos }
  tm.original = urir
  setTimemapInStorage(tm, tm.original)

  chrome.tabs.sendMessage(tabId, { method: 'stopAnimatingBrowserActionIcon' })
  chrome.tabs.sendMessage(tabId, {
    method: 'displayUIStoredTM',
    data: tm
  })
}

function tmInList (tmURI, tms) {
  for (let tm = tms.length - 1; tm >= 0; tm--) {
    if (tms[tm].timemap === tmURI) { return true }
  }
  return false
}

function findTMURI (uri, tabid) {
  log('Finding TimeMap URI', uri)


  $.ajax({
    url: uri
  }).done(function (data, status, xhr) {
    // Get the first timemap
    const tmX = new Timemap(xhr.getResponseHeader('link'))
    log(tmX.timemap, tmX)

    // Tell content to start the timer
    chrome.tabs.sendMessage(tabid, {
      method: 'startTimer'
    })

    // No URI-T but we found a couple mementos
    // See http://ws-dl-05.cs.odu.edu/demo-headers/index.php/Seven_Kingdoms for e.g.
    if (!tmX.timemap && tmX && tmX.mementos && tmX.mementos.length > 0) {
      return Promise.resolve(displayMementosMissingTM(tmX.mementos, uri, tabid))
    }

    // Get the paginated list of timemaps
    Promise.resolve(createTimemapFromURI(tmX.timemap, tabid))
  }).fail(function (xhr, status, err) {
    log(`Querying the tm ${uri} failed`, xhr, status, err)

    // TODO: Reject this request for invalidity, progress with next option (e.g., query aggregator)
    // Perhaps clear this value from localStorage and send a message with the method displayUI
    chrome.tabs.sendMessage(tabid, {
      'method': 'clearLinkHeaderAndDisplayUI'
    })

    // Promise.reject('Error querying URI specified in Link header')
  })
}

function setTimemapInStorageAndCall (tm, url, cb) {
  log('setTimemapInStorageAndCall setting tm in storage', tm, url)

  chrome.storage.local.get('timemaps', function (items) {
    let tms
    log(`setting TM for uri in storage, uri: ${url}`)

    if (!items.timemaps) {
      tms = {}
    } else {
      tms = items.timemaps
    }
    tms[url] = tm

    // Trim the cache if overfull
    if (items.timemaps) {
      log('******* Number of cached TMs:')

      const cachedTMKeys = Object.keys(items.timemaps)
      if (cachedTMKeys.length > 10) { // Keep the cache to a reasonable size through random deletion
        const indexToRemove = Math.floor(Math.random() * cachedTMKeys.length)
        const keyOfIndex = cachedTMKeys[indexToRemove]
        delete tms[keyOfIndex]
      }
    }

    log('* * * setting tms', tms)

    chrome.storage.local.set({ timemaps: tms }, function () {
      chrome.storage.local.getBytesInUse('timemaps', function (bytesUsed) {
        log(`current bytes used: ${bytesUsed}`)
      })
      if (chrome.runtime.lastError) {
        log('There was an error last time we tried to store a memento ', chrome.runtime.lastError.message)

        if (chrome.runtime.lastError.message.indexOf('QUOTA_BYTES_PER_ITEM') > -1) {
          // Chicken wire and duct tape! Clear the cache, do it again, yeah!
          log('LOCALSTORAGE full! clearing!')
          chrome.storage.local.clear()
          log('Re-setting chrome.storage.local with:', tms)

          chrome.storage.local.set({ 'timemaps': tms }, function () {
            cb()
          })
        }
      } else {
        cb()
      }
    })
  })
}

function setTimemapInStorage (tm, url) {
  log('Setting tm in storage', tm, url)

  chrome.storage.local.get('timemaps', function (items) {
    let tms
    log(`setting TM for uri in storage, uri: ${url}`)

    if (!items.timemaps) {
      tms = {}
    } else {
      tms = items.timemaps
    }
    tms[url] = tm
    // Trim the cache if overfull
    if (items.timemaps) {
      log('******* Number of cached TMs:')
      const cachedTMKeys = Object.keys(items.timemaps)
      if (cachedTMKeys.length > 10) { // Keep the cache to a reasonable size through random deletion
        const indexToRemove = Math.floor(Math.random() * cachedTMKeys.length)
        const keyOfIndex = cachedTMKeys[indexToRemove]
        delete tms[keyOfIndex]
      }
    }

    log('* * * setting tms', tms)

    chrome.storage.local.set({ timemaps: tms }, function () {
      chrome.storage.local.getBytesInUse('timemaps', function (bytesUsed) {
        log(`current bytes used: ${bytesUsed}`)
      })
      if (chrome.runtime.lastError) {
        log('There was an error last time we tried to store a memento ', chrome.runtime.lastError.message)
        if (chrome.runtime.lastError.message.indexOf('QUOTA_BYTES_PER_ITEM') > -1) {
          // Chicken wire and duct tape! Clear the cache, do it again, yeah!
          log('LOCALSTORAGE full! clearing!')
          chrome.storage.local.clear()
          log('Re-setting chrome.storage.local with:', tms)

          chrome.storage.local.set({ 'timemaps': tms }, function () {})
        }
      }
    })
  })
}

function displaySecureSiteMementos (mementos, tabid) {
  setBadge(mementos.length, badgeImagesMink, tabid)
}

function showInterfaceForZeroMementos (tabid) {
  log('Displaying zero mementos')
  tmData = {}
  tmData.mementos = {}
  tmData.mementos.list = []
  tmData.original_uri = 'doWeKnowThisHere'

  // TODO: Also set the badge icon to the red memento icon (or something else indicative)
  setBadgeText('', tabid)
  setBadgeIcon(badgeImagesNoMementos, tabid)
  setBadgeTitle(browserActionTitleNoMementos, tabid)
}

chrome.action.onClicked.addListener(tab => {
  console.log('MV3 SW activated')

})

// Save default API suggestions
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('extension installed, reported via SW registration')
    //chrome.storage.local.set({
    //  apiSuggestions: ['tabs', 'storage', 'scripting']
    //});
  }
});


