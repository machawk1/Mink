/* global chrome, $, Timemap, tmData */

var MAX_MEMENTOS_IN_DROPDOWN = 500
var tmData

function createShadowDOM (cb) {
  const selector = '#minkuiX'

  const shadow = document.querySelector('#minkWrapper').attachShadow({ mode: 'open' })
  const template = document.querySelector(selector)
  shadow.appendChild(template)

  if (cb) {
    cb()
  }
}

function setupDrilldownInteractions () {
  setupDrilldownInteractionYear()
}

function appendHTMLToShadowDOM () {
  tmData = arguments[0].tmData
  $.ajax(chrome.runtime.getURL('minkui.html')) // There has to be a more native way to do this
    .done(function (data) {
    // TODO: before invoking any further, check to verify that some mementos exist (the aggregator query has returned).

      $('body').append(data)
      setupUI()

      let mementos
      if (tmData && tmData.mementos && tmData.mementos.list) {
        mementos = tmData.mementos.list // e.g. mementos[15].uri and mementos[15].datetime
      } else {
        mementos = []
      }

      chrome.storage.local.get('timemaps', function (items) {
        let cb = function () {
          createShadowDOM(setupDrilldownInteractions)
        }

        let mCount = mementos.length
        const minkuiRoot = document.querySelector('#minkuiX')
        const viewingMemento = items.timemaps && items.timemaps[document.URL] &&
          items.timemaps[document.URL].mementos && items.timemaps[document.URL].datetime

        if (viewingMemento) {
          mCount = items.timemaps[document.URL].mementos.length

          // Hide initially irrelevant UI items
          const selectorsToHide = ['.dropdown', '#drilldownBox', '#steps', '#title_dropdown', '#archiveNow']

          selectorsToHide.forEach(selector => {
            minkuiRoot.querySelector(selector).classList.add('hidden')
          })

          minkuiRoot.querySelector('#viewingMementoInterface').classList.remove('hidden')

          minkuiRoot.querySelector('#mementosAvailable').innerHTML =
            `Viewing memento at ${(new Date(items.timemaps[document.URL].datetime))}`

          const firstButton = minkuiRoot.querySelector('#memento_first')
          const lastButton = minkuiRoot.querySelector('#memento_last')
          const prevButton = minkuiRoot.querySelector('#memento_prev')
          const nextButton = minkuiRoot.querySelector('#memento_next')

          items.timemaps[document.URL].mementos.forEach(function (mem) {
            let targetButton
            if (mem.first === true) {
              targetButton = firstButton
            }
            if (mem.last === true) {
              targetButton = lastButton
            }
            if (mem.next === true) {
              targetButton = nextButton
            }
            if (mem.prev === true) {
              targetButton = prevButton
            }

            if (typeof targetButton !== 'undefined') {
              if (mem.uri === window.document.URL) {
                targetButton.classList.add('viewingMemento')
              }

              targetButton.removeAttribute('disabled')
              targetButton.dataset.uri = mem.uri
            }
          })

          cb = createShadowDOM
        } else if (mCount > MAX_MEMENTOS_IN_DROPDOWN) {
          minkuiRoot.querySelector('#minkuiX .dropdown').classList.add('hidden')
          minkuiRoot.querySelector('#minkuiX #title_drilldown').classList.add('active')
          buildDropDown([])

          let cleanedURIR = document.URL
          // Strip URI-Rs with hashes if necessary
          if (!items.timemaps.hasOwnProperty(document.URL)) {
            cleanedURIR = document.URL.replace(/#.*$/, '')
          }

          buildDrilldownYear(items.timemaps[cleanedURIR].mementos.list)
        } else if (mCount === 0) {
          switchToArchiveNowInterface()
        } else {
          buildDropDown(mementos)
          buildDrilldownYear(mementos)
          minkuiRoot.querySelector('#drilldownBox').classList.add('hidden')
          minkuiRoot.querySelector('#title_dropdown').classList.add('active')
        }

        // Append CSS1
        if (!viewingMemento) {
          let mementoPlurality = 'mementos'
          minkuiRoot.querySelector('#mementosAvailable span#mementoCount').innerHTML = mCount.toLocaleString()
          if (mCount === 1) {
            mementoPlurality = 'memento'
          }
          minkuiRoot.querySelector('#mementosAvailable span#mementoPlurality').innerHTML = mementoPlurality
        }

        // Append CSS2
        appendCSSToShadowDOM(cb)
      })
    })
    chrome.runtime.onMessage.removeListener(appendHTMLToShadowDOM)
}

// In some places, getting addZ has already been declared, thus var for now
var addZ = (n) => {
  return n < 10 ? '0' + n : '' + n
}

function buildDropDown (mementos) {
  let mementoDropdown = document.querySelector('#mementosDropdown')
  for (let mm = 0; mm < mementos.length; mm++) {
    let newOption = document.createElement('option')
    newOption.dataset.uri = mementos[mm].uri
    newOption.dataset.datetime = mementos[mm].datetime
    newOption.text = (new Date(mementos[mm].datetime))
    mementoDropdown.appendChild(newOption)
  }
  mementoDropdown.dataset.mementoCount = mementos.length

  if (mementos.length === 0) {
    document.querySelector('#title_dropdown').classList.add('disabled')
  }
}

function switchToArchiveNowInterface () {
  const showElements = ['#mementosDropdown', '#drilldownBox', '#viewMementoButton', '#minkStatus #steps', '#archiveNow']
  showElements.forEach(element => {
    document.querySelector(element).classList.add('noMementos')
  })

  document.querySelector('#archiveNowInterface').classList.remove('hidden')
  document.querySelector('.hideInNoMementosInterface').classList.add('hidden')
}

function appendCSSToShadowDOM (cb) {
  $.ajax(chrome.runtime.getURL('css/minkui.css'))
    .done(function (data) {
      const styleElement = `<style type="text/css">\n${data}\n</style>\n`
      $('#minkuiX').prepend(styleElement)
      cb()
    })
}

function randomEmail () { // eslint-disable-line no-unused-vars
  // Create random-generating function
  const randy = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  // Choices for the email character pool
  const alpha = 'abcdefghijklmnopqrstuvwxyz'
  const choices = 'abcdefghijklmnopqrstuvwxyz' + '0123456789'
  const domain = ['.com', '.org', '.edu', '.co.uk', '.net'][randy(0, 4)]

  let text = ''

  // Have a function that will make a unique part of an
  // Email 1 to 3 characters long
  const getPart = function (pool) {
    const len = randy(1, 3)
    let it = ''
    for (let i = 0; i < len; ++i) {
      it += pool.charAt(randy(0, pool.length - 1))
    }
    return it
  }

  let len = randy(2, 4)
  // Get user portion of email
  for (let i = 0; i < len; ++i) {
    text += getPart(choices)
  }

  text += '@'

  len = randy(2, 3)
  // Get email host
  for (let i = 0; i < len; ++i) {
    text += getPart(alpha)
  }

  // Append the domain
  text += domain

  return text
}

function archiveURIArchiveOrg (cb, openInNewTab) {
  $.ajax({
    method: 'GET',
    url: `//web.archive.org/save/${document.URL}`
  })
    .done(function (a, b, c) {
      if (b === 'success') {
        chrome.runtime.sendMessage({
          method: 'notify',
          title: 'Mink',
          body: 'Archive.org Successfully Preserved page.\r\nSelect again to view.'
        }, function (response) {})
        if (cb) {
          cb()
        }

        const shadow = document.getElementById('minkWrapper').shadowRoot
        shadow.getElementById('archivelogo_ia').classList.add('archiveNowSuccess')

        const parsedRawArchivedURI = a.match(/"\/web\/.*"/g)
        const archiveURI = `https://web.archive.org${parsedRawArchivedURI[0].substring(1, parsedRawArchivedURI[0].length - 1)}`
        shadow.getElementById('archivelogo_ia').setAttribute('title', archiveURI)
        shadow.getElementById('archivelogo_ia').onclick = function () {
          if (!openInNewTab) {
            window.location = $(this).attr('title')
          } else {
            window.open($(this).attr('title'))
          }
        }
      }
    })
}

function archiveURIArchiveDotIs (cb, openInNewTab) {
  $.ajax({
    method: 'POST',
    url: '//archive.is/submit/',
    data: { coo: '', url: document.URL }
  })
    .done(function (data, status, xhr) {
      if (status === 'success') {
        chrome.runtime.sendMessage({
          method: 'notify',
          title: 'Mink',
          body: 'Archive.is Successfully Preserved page.\r\nSelect again to view.'
        })
        if (cb) {
          cb()
        }

        $('#archiveNow_archivedotis').addClass('archiveNowSuccess')

        const linkHeader = xhr.getResponseHeader('link')
        const tmFromLinkHeader = new Timemap(linkHeader)
        const archiveURI = tmFromLinkHeader.mementos[tmFromLinkHeader.mementos.length - 1].uri

        const shadow = document.getElementById('minkWrapper').shadowRoot
        shadow.getElementById('archivelogo_ais').classList.add('archiveNowSuccess')

        shadow.getElementById('archivelogo_ais').setAttribute('title', archiveURI)
        shadow.getElementById('archivelogo_ais').onclick = function () {
          if (!openInNewTab) {
            window.location = $(this).attr('title')
          } else {
            window.open($(this).attr('title'))
          }
        }
      }
    })
}

function archiveURI (img, archiveid, openInNewTab) {
  chrome.runtime.sendMessage({
    method: 'archive',
    archive: archiveid,
    urir: document.URL,
    imgId: img.id,
    imgURI: img.uri,
    newTab: openInNewTab
  })
}

/* Vars in this namespace get "already declared" error when injected, hence var instead of let */
var years = {}
/* Begin date function, TODO: move to separate file */

function getShortMonthNameFromMonthInt (locale, format, monthInt) {
  return new Intl.DateTimeFormat(locale, { month: format }).format(new Date(2020, monthInt))
}

function getNumberWithOrdinal (n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/* End date functions */

function buildDrilldownYear (mementos) {
  // NOTE: Shadow DOM not yet built. Do so after this function
  let years = {}

  $(mementos).each(function (mI, m) {
    const yr = (new Date(m.datetime)).getFullYear()
    if (!years[yr]) { years[yr] = [] }
    years[yr].push(m)
  })

  let memCountList = '<ul id="years">'
  for (const year in years) {
    memCountList += `<li data-year="${year}">${year}<span class="memCount">${years[year].length}</span></li>\r\n`
  }

  memCountList += '</ul>'

  $('body #drilldownBox').append(memCountList)
}

function setupDrilldownInteractionYear () {
  const shadow = document.getElementById('minkWrapper').shadowRoot

  // No stored TM, halt building irrelevant drilldown
  if (!shadow.getElementById('years')) { return }

  const yearsDOM = shadow.getElementById('years').childNodes

  for (let year = 0; year < yearsDOM.length; year++) {
    yearsDOM[year].onclick = function (event) {
      const existingMonthsUL = shadow.getElementById('months')
      const existingDaysUL = shadow.getElementById('days')
      const existingTimesUL = shadow.getElementById('times')
      const drilldownShadow = shadow.getElementById('drilldownBox')

      if (existingMonthsUL) {
        drilldownShadow.removeChild(existingMonthsUL)
      }

      if (existingDaysUL) {
        drilldownShadow.removeChild(existingDaysUL)
      }

      if (existingTimesUL) {
        drilldownShadow.removeChild(existingTimesUL)
      }

      buildDrilldownMonth($(this).data('year'))
      $(this).siblings().removeClass('selectedOption')
      $(this).addClass('selectedOption')
    }
  }
}

function buildDrilldownMonth (year) {
  const mementos = tmData.mementos.list

  const monthUL = document.createElement('ul')
  monthUL.id = 'months'

  const months = {}

  for (let memento in mementos) {
    const mementoDate = new Date(mementos[memento].datetime)
    const mementoYear = mementoDate.getFullYear()

    if (mementoYear !== year) {
      continue
    }

    const monthName = getShortMonthNameFromMonthInt('en', 'short', mementoDate.getMonth())

    if (!months[monthName]) {
      months[monthName] = []
    }
    months[monthName].push(year[memento])
  }

  for (const month in months) {
    const li = document.createElement('li')
    li.setAttribute('data-month', month)
    li.setAttribute('data-year', year)
    li.appendChild(document.createTextNode(month))

    const liSpan = document.createElement('span')
    liSpan.className = 'memCount'
    liSpan.appendChild(document.createTextNode(months[month].length))

    li.appendChild(liSpan)
    li.onclick = function (event) {
      buildDrilldownDay($(this).data('year'), $(this).data('month'))
      $(this).siblings().removeClass('selectedOption')
      $(this).addClass('selectedOption')
    }

    monthUL.appendChild(li)
  }

  const shadow = document.getElementById('minkWrapper').shadowRoot

  const existingMonthsUL = shadow.getElementById('months')
  const existingDaysUL = shadow.getElementById('days')
  const existingTimesUL = shadow.getElementById('times')
  const drilldownShadow = shadow.getElementById('drilldownBox')

  if (existingMonthsUL) {
    drilldownShadow.removeChild(existingMonthsUL)
  }

  if (existingDaysUL) {
    drilldownShadow.removeChild(existingDaysUL)
  }

  if (existingTimesUL) {
    drilldownShadow.removeChild(existingTimesUL)
  }

  drilldownShadow.appendChild(monthUL)
}

function buildDrilldownDay (year, month) {
  const mementos = tmData.mementos.list

  const dayUL = document.createElement('ul')
  dayUL.id = 'days'

  const days = {}

  for (let memento in mementos) {
    let dt = new Date(mementos[memento].datetime)
    let monthShort = getShortMonthNameFromMonthInt('en', 'short', dt.getMonth())
    let ordinalDate = getNumberWithOrdinal(dt.getDate())

    if (dt.getFullYear() !== year || monthShort !== month) {
      continue
    }

    const dayName = ordinalDate

    if (!days[dayName]) {
      days[dayName] = []
    }
    days[dayName].push(mementos[memento])
  }

  for (const day in days) {
    const li = document.createElement('li')
    li.setAttribute('data-date', day)
    li.setAttribute('data-month', month)
    li.setAttribute('data-year', year)
    li.appendChild(document.createTextNode(day))

    const liSpan = document.createElement('span')
    liSpan.className = 'memCount'
    liSpan.appendChild(document.createTextNode(days[day].length))

    li.appendChild(liSpan)
    li.onclick = function (event) {
      buildDrilldownTime($(this).data('year'), $(this).data('month'), parseInt($(this).data('date'), 10))
      $(this).siblings().removeClass('selectedOption')
      $(this).addClass('selectedOption')
    }

    dayUL.appendChild(li)
  }

  const shadow = document.getElementById('minkWrapper').shadowRoot

  const existingDaysUL = shadow.getElementById('days')
  const existingTimesUL = shadow.getElementById('times')
  const drilldownShadow = shadow.getElementById('drilldownBox')

  if (existingDaysUL) {
    drilldownShadow.removeChild(existingDaysUL)
  }

  if (existingTimesUL) {
    drilldownShadow.removeChild(existingTimesUL)
  }

  drilldownShadow.appendChild(dayUL)
}

function buildDrilldownTime (year, month, date) {
  const mementos = tmData.mementos.list

  const timeUL = document.createElement('ul')
  timeUL.id = 'times'

  const times = []

  for (let memento in mementos) {
    const mementoDatetime = new Date(mementos[memento].datetime)
    const mementoYear = mementoDatetime.getFullYear()
    const monthName = getShortMonthNameFromMonthInt('en', 'short', mementoDatetime.getMonth())
    const mementoDate = mementoDatetime.getDate()

    if (mementoYear !== year || monthName !== month || mementoDate !== date) {
      // REJECT
      continue
    }

    const paddedHours = addZ(mementoDatetime.getHours())
    const paddedMinutes = addZ(mementoDatetime.getMinutes())
    const paddedSeconds = addZ(mementoDatetime.getSeconds())
    mementos[memento].time = `${paddedHours}:${paddedMinutes}:${paddedSeconds}`

    times.push(mementos[memento])
  }

  for (const timeIndex in times) {
    const li = document.createElement('li')
    li.setAttribute('data-time', timeIndex)
    li.setAttribute('data-day', date)
    li.setAttribute('data-month', month)
    li.setAttribute('data-year', year)

    let a = document.createElement('a')
    a.appendChild(document.createTextNode(times[timeIndex].time))
    a.setAttribute('href', times[timeIndex].uri)

    a.onclick = function (event) {
      $(this).parent().siblings().removeClass('selectedOption')
      $(this).parent().addClass('selectedOption')
    }
    li.appendChild(a)

    timeUL.appendChild(li)
  }

  const shadow = document.getElementById('minkWrapper').shadowRoot

  const existingTimesUL = shadow.getElementById('times')
  const drilldownShadow = shadow.getElementById('drilldownBox')

  if (existingTimesUL) {
    drilldownShadow.removeChild(existingTimesUL)
  }
  drilldownShadow.appendChild(timeUL)
}

function setupUI () {
  replaceContentScriptImagesWithChromeExtensionImages()
  bindSteps() // What steps!?!
  bindOptions()
  bindViewButton()
  bindDropdown()
  bindDrilldown()
  bindArchiveNowButton()
  bindGoBackToMainInterfaceButton()
  bindArchiveLogos()
  bindGoBackToLiveWebButton()
  bindNavigationButtons()

  $('#viewMementoButton').click(function () {
    window.location = $(this).attr('alt')
  })
}

function replaceContentScriptImagesWithChromeExtensionImages () {
  document.getElementById('minkLogo').src = chrome.runtime.getURL('images/mink_marvel_80.png')

  document.getElementById('archivelogo_ia').src = chrome.runtime.getURL('images/archives/iaLogo.png')
  document.getElementById('archivelogo_ais').src = chrome.runtime.getURL('images/archives/archiveisLogo.png')
  document.getElementById('archivelogo_ala').src = chrome.runtime.getURL('images/archives/allListedArchives.png')
}

function bindSteps () {
  $('#steps li').click(function () {
    if ($(this).attr('data-status') === 'waiting') {
      $(this).attr('data-status', 'processing')
    } else if ($(this).attr('data-status') === 'processing') {
      $(this).attr('data-status', 'complete')
    } else if ($(this).attr('data-status') === 'complete') {
      $(this).attr('data-status', 'waiting')
    }
  })
}

function bindOptions () {
  $('#options').click(function () {
    chrome.runtime.sendMessage({ method: 'openOptionsPage' })
  })
}

function bindViewButton () {
  const viewButton = $('#viewMementoButton')

  $('#mementosDropdown').change(function () {
    if ($(this)[0].selectedIndex === 0) {
      $(viewButton).attr('disabled', 'disabled')
      $(viewButton).removeAttr('alt')
    } else {
      $(viewButton).removeAttr('disabled')
      $(viewButton).attr('alt', $(this).find('option:selected').data('uri'))
    }
  })
}

function bindDropdown () {
  document.getElementById('title_dropdown').onclick = function () {
    const shadow = document.getElementById('minkWrapper').shadowRoot
    const mementosDropdown = shadow.getElementById('mementosDropdown')
    const viewMementoButton = shadow.getElementById('viewMementoButton')
    const drilldownBox = shadow.getElementById('drilldownBox')

    if (mementosDropdown.getAttribute('data-memento-count') + '' === '0') {
      window.alert('The dropdown interface is unavailable for large collections of mementos due to browser performance degradation.')
      return
    }

    mementosDropdown.className = 'dropdown'
    viewMementoButton.className = 'dropdown'
    shadow.getElementById('title_dropdown').className = 'active'
    drilldownBox.className = 'hidden'

    shadow.getElementById('title_drilldown').className = ''
  }
}

function bindDrilldown () {
  document.getElementById('title_drilldown').onclick = function () {
    const shadow = document.getElementById('minkWrapper').shadowRoot
    const mementosDropdown = shadow.getElementById('mementosDropdown')
    const viewMementoButton = shadow.getElementById('viewMementoButton')
    const drilldownBox = shadow.getElementById('drilldownBox')
    const drilldownTitle = shadow.getElementById('title_drilldown')
    const dropdownTitle = shadow.getElementById('title_dropdown')

    if (!dropdownTitle.classList.contains('disabled')) {
      mementosDropdown.className = 'dropdown hidden'
      viewMementoButton.className = 'dropdown hidden'
      shadow.getElementById('title_dropdown').className = ''
      drilldownBox.className = ''

      drilldownTitle.className = 'active'
    }
  }
}

function changeIconFor (id, src) {
  const shadow = document.getElementById('minkWrapper').shadowRoot
  shadow.querySelector(`#{id}`).setAttribute('src', src)
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.method === 'showViewingMementoInterface') {
      console.log('caught showViewingMementoInterface, tweak UI here')
    } else if (request.method === 'archiveDone') {
      changeIconFor(request.imgId, request.imgURI)
      showSuccessfullyArchivedURI(request.data, request.newTab)
    } else {
      console.log('caught message in minkui.html but did not react')
    }
  }
)

function showSuccessfullyArchivedURI (archiveURI, openInNewTab) {
  chrome.runtime.sendMessage({
    method: 'notify',
    title: 'Mink',
    body: 'Archive.org Successfully Preserved page.\r\nSelect again to view.'
  }, function (response) {})

  const shadow = document.getElementById('minkWrapper').shadowRoot
  shadow.getElementById('archivelogo_ia').classList.add('archiveNowSuccess')
  shadow.getElementById('archivelogo_ia').setAttribute('title', archiveURI)
  shadow.getElementById('archivelogo_ia').onclick = function () {
    if (!openInNewTab) {
      window.location = $(this).attr('title')
    } else {
      window.open($(this).attr('title'))
    }
  }
}

function displayAndHideShadowDOMElements (showElementsIds, hideElementsIds) {
  const shadow = document.getElementById('minkWrapper').shadowRoot

  let ee
  for (ee = 0; ee < showElementsIds.length; ee++) {
    shadow.getElementById(showElementsIds[ee]).classList.remove('hidden', 'nonArchiveNowInterface')
  }

  for (ee = 0; ee < hideElementsIds.length; ee++) {
    shadow.getElementById(hideElementsIds[ee]).classList.add('hidden', 'nonArchiveNowInterface')
  }
}

function bindArchiveNowButton () {
  $('#minkuiX #archiveNow').click(function () {
    const show = ['archiveNowInterface']
    const hide = ['archiveNow', 'steps']

    const shadow = document.getElementById('minkWrapper').shadowRoot
    const dropdownActive = shadow.getElementById('title_dropdown').classList.contains('active')
    const drilldownActive = shadow.getElementById('title_drilldown').classList.contains('active')

    if (dropdownActive) {
      hide.push('mementosDropdown', 'viewMementoButton')
    } else if (drilldownActive) {
      hide.push('drilldownBox')
    }

    displayAndHideShadowDOMElements(show, hide)
  })
}

function bindGoBackToMainInterfaceButton () {
  $('#minkuiX #goBackButton').click(function () {
    const hide = ['archiveNowInterface']
    const show = ['archiveNow', 'steps']

    const shadow = document.getElementById('minkWrapper').shadowRoot
    const dropdownActive = shadow.getElementById('title_dropdown').classList.contains('active')
    const drilldownActive = shadow.getElementById('title_drilldown').classList.contains('active')

    if (dropdownActive) {
      show.push('mementosDropdown', 'viewMementoButton')
    } else if (drilldownActive) {
      show.push('drilldownBox')
    }

    displayAndHideShadowDOMElements(show, hide)
  })
}

function bindArchiveLogos () {
  const iaLogo = $('#archivelogo_ia')
  const aisLogo = $('#archivelogo_ais')

  const alaLogo = $('#archivelogo_ala') // All archives

  const openInNewTab = false

  $('.archiveLogo').click(function () {
    if ($(this).attr('src').indexOf('_success') > -1) { // Already archived, view
      return
    }

    const that = this
    const newSrc = $(this).attr('src').replace('.png', '_success.png')
    $(this).attr('src', chrome.runtime.getURL('./images/spinner.gif'))

    const archiveLogoID = $(this).attr('id')

    const img = {
      id: 'archivelogo_ia',
      uri: newSrc
    }

    if (archiveLogoID === 'archivelogo_ia') {
      const archiveid = 'ia'
      archiveURI(img, archiveid, openInNewTab)
    } else if (archiveLogoID === 'archivelogo_ais') {
      const archiveid = 'ais'
      img.id = 'archivelogo_ais'
      archiveURI(img, archiveid, openInNewTab)
    } else if (archiveLogoID === 'archivelogo_ala') { // Async calls to 2 archives
      // TOFIX: match above calls
      /*
      const iaNewSrc = $(iaLogo).attr('src').replace('.png', '_success.png')
      const aisNewSrc = $(aisLogo).attr('src').replace('.png', '_success.png')

      // This might be better accomplished with Promise.all()
      const iaCb = function () {
        changeIconFor(iaLogo, iaNewSrc)
        changeArchiveAllIconWhenComplete(alaLogo)
      }
      const aisCb = function () {
        changeIconFor(aisLogo, aisNewSrc)
        changeArchiveAllIconWhenComplete(alaLogo)
      }

      $(iaLogo).attr('src', chrome.runtime.getURL('./images/spinner.gif'))
      $(aisLogo).attr('src', chrome.runtime.getURL('./images/spinner.gif'))

      openInNewTab = true
      archiveURIArchiveOrg(iaCb, openInNewTab)
      archiveURIArchiveDotIs(aisCb, openInNewTab)
      */
    }
  })
}

var archivesFinished = 0 /* TOFIX This is doubly declared if 'let' */
function changeArchiveAllIconWhenComplete (iconObj) {
  archivesFinished++
  if (archivesFinished >= 2) {
    $(iconObj).attr('src', chrome.runtime.getURL('./images/archives/allListedArchives_success.png'))
    $(iconObj).unbind()
    $(iconObj).removeClass('archiveLogo')
  }
}

function bindGoBackToLiveWebButton () {
  $('#backToLiveWeb').click(function () {
    chrome.storage.local.get('timemaps', function (items) {
      window.location = items.timemaps[document.URL].original
    })
  })
}

function bindNavigationButtons () {
  ['first', 'last', 'next', 'prev'].forEach(function attachURI (rel) {
    document.getElementById(`memento_${rel}`).addEventListener('click', event => {
      window.location = event.target.getAttribute('data-uri')
    })
  })
}

function echoTMDataForMV3 (tmData) {
  console.log('Echoing TM Data For MV3')
  console.log(tmData)
}

if (document.getElementById('minkWrapper') === null) {
  chrome.runtime.onMessage.addListener(appendHTMLToShadowDOM)
} else {
  $('#minkWrapper').toggle()
}
