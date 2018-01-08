/* global chrome, $, Timemap, moment, tmData */

const MAX_MEMENTOS_IN_DROPDOWN = 500
const debug = false
function createShadowDOM (cb) {
  const selector = '#minkuiX'

  let shadow = document.querySelector('#minkWrapper').createShadowRoot()
  const template = document.querySelector(selector)
  // var clone = document.importNode(template, true)
  shadow.appendChild(template)

  if (debug) {
    console.log('in createShadowDOM()')
    console.log(cb)
  }
  if (cb) {
    cb()
  }
}

function setupDrilldownInteractions () {
  setupDrilldownInteraction_Year()
}

function appendHTMLToShadowDOM () {
  $.ajax(chrome.extension.getURL('minkui.html'))
  .done(function (data) {
    if (debug) { console.log('TODO: before invoking any further, check to verify that some mementos exist (the aggregator query has returned).') }

    $('body').append(data)
    setupUI()

    let mementos
    if (tmData && tmData.mementos) {
      mementos = tmData.mementos.list // e.g. mementos[15].uri and mementos[15].datetime
    } else {
      mementos = []
    }

    chrome.storage.local.get('timemaps', function (items) {
      let cb = function () {
        createShadowDOM(setupDrilldownInteractions)
      }
      let mCount = mementos.length

      if (items.timemaps && items.timemaps[document.URL] && items.timemaps[document.URL].mementos && items.timemaps[document.URL].datetime) {
        if (debug) { console.log('qq') }
        mCount = items.timemaps[document.URL].mementos.length
        if (debug) {
          console.log('c')
          console.log('isAMemento, hide ALL THE THINGS!')
        }
        $('.dropdown').addClass('hidden')
        $('#drilldownBox').addClass('hidden')
        $('#steps').addClass('hidden')
        $('#title_dropdown').addClass('hidden')
        $('#archiveNow').addClass('hidden')
        $('#viewingMementoInterface').removeClass('hidden')
        $('#mementosAvailable').html('Viewing memento at ' + (new Date(items.timemaps[document.URL].datetime)))
        cb = createShadowDOM
      } else if (mCount > MAX_MEMENTOS_IN_DROPDOWN) {
        $('.dropdown').addClass('hidden')
        $('#steps .action').removeClass('active')
        $('#title_drilldown').addClass('active')
        buildDropDown([])
        buildDrilldown_Year(items.timemaps[document.URL].mementos.list)
      } else if (mCount === 0) {
        switchToArchiveNowInterface()
      } else {
        buildDropDown(mementos)
        buildDrilldown_Year(mementos)
        $('#drilldownBox').addClass('hidden')
        $('#steps .action').removeClass('active')
        $('#title_dropdown').addClass('active')
      }

      // Append CSS1
      $('#mementosAvailable span').html(mCount)
      // Append CSS2
      appendCSSToShadowDOM(cb)
    })
  })
}

function addZ (n) {
  return n < 10 ? '0' + n : '' + n
}

function buildDropDown (mementos) {
  let mementoSelections = ''
  for (let mm = 0; mm < mementos.length; mm++) {
    mementoSelections += '<option data-uri="' + mementos[mm].uri + '" data-datetime="' + mementos[mm].datetime + '">' + (new Date(mementos[mm].datetime)) + '</option>'
  }

  $('#mementosDropdown').attr('data-memento-count', mementos.length)
  if (mementos.length === 0) {
    $('#title_dropdown').addClass('disabled')
  }
  $('#mementosDropdown').append(mementoSelections)
  /* $('#mementosDropdown').select2({
      templateResult: formatArchiveDropdown,
      theme: "classic"
    })
    $('#mementosDropdown').replaceWith($('#select2-mementosDropdown-results'))
  */
}

/* For select2 library, not yet implemented
var dropdownIcon_ia = chrome.extension.getURL('images/archives/dropdown_ia.png')
var dropdownIcon_wc = chrome.extension.getURL('images/archives/dropdown_wc.png')
var dropdownIcon_ais = chrome.extension.getURL('images/archives/dropdown_ais.png')

function formatArchiveDropdown (ddEntry) {
  if (!ddEntry.id) { return ddEntry.text }
  var urim = $(ddEntry.element).data('uri') || ''

  var imgSrc = ''

  if (urim.indexOf('web.archive.org') !== -1) {
    imgSrc = dropdownIcon_ia
  } else if (urim.indexOf('webcitation.org') !== -1) {
    imgSrc = dropdownIcon_wc
  } else if (urim.indexOf('archive.is') !== -1) {
    imgSrc = dropdownIcon_ais
  }

  var $ddEntry = ddEntry.text
  if (imgSrc !== '') {
    $ddEntry = $('<span><img src="' + imgSrc + '" /> ' + ddEntry.text + '</span>')
  }
  return $ddEntry
}*/

function switchToArchiveNowInterface () {
  $('#mementosDropdown').addClass('noMementos')
  $('#drilldownBox').addClass('noMementos')
  $('#viewMementoButton').addClass('noMementos')
  $('#minkStatus #steps').addClass('noMementos')

  $('#archiveNow').addClass('noMementos')
  $('#archiveNowInterface').removeClass('hidden')
  $('.hideInNoMementosInterface').addClass('hidden')
}

function appendCSSToShadowDOM (cb) {
  $.ajax(chrome.extension.getURL('css/minkui.css'))
  .done(function (data) {
    const styleElement = '<style type="text/css">\n' + data + '\n</style>\n'
    $('#minkuiX').prepend(styleElement)
    cb()
  })
}

function randomEmail () {
  // Create random-generating function
  var randy = function (min, max) {
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
  for (i = 0; i < len; ++i) {
    text += getPart(alpha)
  }

  // Append the domain
  text += domain

  return text
}

function archiveURI_webCite (cb, openInNewTab) {
  const remail = randomEmail()
  $.ajax({
    method: 'POST',
    url: 'https://www.webcitation.org/archive',
    data: {
      url: document.URL,
      email: remail
    }
  }).done(function (data, status, xhr) {
    if (status === 'success') {
      chrome.runtime.sendMessage({
        method: 'notify',
        title: 'Mink',
        body: 'WebCitation.org Successfully Preserved page.\r\nSelect again to view.'
      })

      if (cb) {
        cb()
      }

      const shadow = document.getElementById('minkWrapper').shadowRoot
      shadow.getElementById('archivelogo_webcite').classList.add('archiveNowSuccess')

      // Verbose regex but wanted to ensure exact capture
      const archiveURI = data.match(/([A-Za-z]{4,5}:\/\/[a-z]{3}.[a-z]{11}.[a-z]{3}\/[a-zA-z0-9]{9})/g)[0]
      shadow.getElementById('archivelogo_webcite').setAttribute('title', archiveURI)
      shadow.getElementById('archivelogo_webcite').onclick = function () {
        if (!openInNewTab) {
          window.location = $(this).attr('title')
        } else {
          window.open($(this).attr('title'))
        }
      }
    } else {
      chrome.runtime.sendMessage({
        method: 'notify',
        title: 'Mink',
        body: 'WebCitation.org Did Not Successfully Preserved page.\r\n'
      })
    }
  })
}

function archiveURI_archiveOrg (cb, openInNewTab) {
  $.ajax({
    method: 'GET',
    url: '//web.archive.org/save/' + document.URL
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

      const parsedRawArchivedURI = a.match(/\"\/web\/.*\"/g)
      const archiveURI = 'http://web.archive.org' + parsedRawArchivedURI[0].substring(1, parsedRawArchivedURI[0].length - 1)
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

function archiveURI_archiveDotIs (cb, openInNewTab) {
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

let years = {}
var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
var dayNames = ['NA', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
          '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th',
          '21st', '22nd', '23rd', '24th', '25th', '26th', '27th', '28th', '29th', '30th', '31st']

function buildDrilldown_Year (mementos) {
  // NOTE: Shadow DOM not yet built. Do so after this function
  years = null
  years = {}

  $(mementos).each(function (mI, m) {
    var dt = moment(m.datetime)
    if (!years[dt.year()]) { years[dt.year()] = [] }
    years[dt.year()].push(m)
  })

  var memCountList = '<ul id="years">'
  for (var year in years) {
    memCountList += '<li data-year="' + year + '">' + year + '<span class="memCount">' + years[year].length + '</span></li>\r\n'
  }

  memCountList += '</ul>'

  $('body #drilldownBox').append(memCountList)
}

function setupDrilldownInteraction_Year () {
  var shadow = document.getElementById('minkWrapper').shadowRoot

  // No stored TM, halt building irrelevant drilldown
  if (!shadow.getElementById('years')) { return }

  var years = shadow.getElementById('years').childNodes

  for (var year = 0; year < years.length; year++) {
    years[year].onclick = function (event) {
      var existingMonthsUL = shadow.getElementById('months')
      var existingDaysUL = shadow.getElementById('days')
      var existingTimesUL = shadow.getElementById('times')
      var drilldownShadow = shadow.getElementById('drilldownBox')

      if (existingMonthsUL) {
        drilldownShadow.removeChild(existingMonthsUL)
      }

      if (existingDaysUL) {
        drilldownShadow.removeChild(existingDaysUL)
      }

      if (existingTimesUL) {
        drilldownShadow.removeChild(existingTimesUL)
      }

      buildDrilldown_Month($(this).data('year'))
      $(this).siblings().removeClass('selectedOption')
      $(this).addClass('selectedOption')
    }
  }
}

function buildDrilldown_Month (year) {
  var mementos = tmData.mementos.list

  var monthUL = document.createElement('ul')
  monthUL.id = 'months'

  var months = {}

  for (var memento in mementos) {
    var datetime = moment(mementos[memento].datetime)
    if (datetime.year() !== year) {
      continue
    }

    var monthName = monthNames[datetime.month()]
    if (!months[monthName]) {
      months[monthName] = []
    }
    months[monthName].push(year[memento])
  }

  for (var month in months) {
    var li = document.createElement('li')
    li.setAttribute('data-month', month)
    li.setAttribute('data-year', year)
    li.appendChild(document.createTextNode(month))

    var liSpan = document.createElement('span')
    liSpan.className = 'memCount'
    liSpan.appendChild(document.createTextNode(months[month].length))

    li.appendChild(liSpan)
    li.onclick = function (event) {
      buildDrilldown_Day($(this).data('year'), $(this).data('month'))
      $(this).siblings().removeClass('selectedOption')
      $(this).addClass('selectedOption')
    }

    monthUL.appendChild(li)
  }

  var shadow = document.getElementById('minkWrapper').shadowRoot

  var existingMonthsUL = shadow.getElementById('months')
  var existingDaysUL = shadow.getElementById('days')
  var existingTimesUL = shadow.getElementById('times')
  var drilldownShadow = shadow.getElementById('drilldownBox')

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

function buildDrilldown_Day (year, month) {
  var mementos = tmData.mementos.list

  let dayUL = document.createElement('ul')
  dayUL.id = 'days'

  var days = {}

  for (var memento in mementos) {
    var datetime = moment(mementos[memento].datetime)

    if (datetime.year() !== year || monthNames[datetime.month()] !== month) {
      continue
    }

    var dayName = dayNames[datetime.date()]
    if (!days[dayName]) {
      days[dayName] = []
    }
    days[dayName].push(mementos[memento])
  }

  for (var day in days) {
    var li = document.createElement('li')
    li.setAttribute('data-date', day)
    li.setAttribute('data-month', month)
    li.setAttribute('data-year', year)
    li.appendChild(document.createTextNode(day))

    var liSpan = document.createElement('span')
    liSpan.className = 'memCount'
    liSpan.appendChild(document.createTextNode(days[day].length))

    li.appendChild(liSpan)
    li.onclick = function (event) {
      buildDrilldown_Time($(this).data('year'), $(this).data('month'), parseInt($(this).data('date'), 10))
      $(this).siblings().removeClass('selectedOption')
      $(this).addClass('selectedOption')
    }

    dayUL.appendChild(li)
  }

  var shadow = document.getElementById('minkWrapper').shadowRoot

  var existingDaysUL = shadow.getElementById('days')
  var existingTimesUL = shadow.getElementById('times')
  var drilldownShadow = shadow.getElementById('drilldownBox')

  if (existingDaysUL) {
    drilldownShadow.removeChild(existingDaysUL)
  }

  if (existingTimesUL) {
    drilldownShadow.removeChild(existingTimesUL)
  }

  drilldownShadow.appendChild(dayUL)
}

function buildDrilldown_Time (year, month, date) {
  var mementos = tmData.mementos.list

  var timeUL = document.createElement('ul')
  timeUL.id = 'times'

  var times = []

  for (var memento in mementos) {
    var datetime = moment(mementos[memento].datetime)

    if (datetime.year() !== year || monthNames[datetime.month()] !== month || datetime.date() !== date) {
      // REJECT
      continue
    }

    var time = addZ(datetime.hour()) + ':' + addZ(datetime.minute()) + ':' + addZ(datetime.second())
    mementos[memento].time = time
    times.push(mementos[memento])
  }

  for (var timeIndex in times) {
    var li = document.createElement('li')
    li.setAttribute('data-time', timeIndex)
    li.setAttribute('data-day', date)
    li.setAttribute('data-month', month)
    li.setAttribute('data-year', year)
    li.appendChild(document.createTextNode(times[timeIndex].time))

    li.onclick = function (event) {
      $(this).siblings().removeClass('selectedOption')
      $(this).addClass('selectedOption')
      window.location = times[timeIndex].uri
    }

    timeUL.appendChild(li)
  }

  var shadow = document.getElementById('minkWrapper').shadowRoot

  var existingTimesUL = shadow.getElementById('times')
  var drilldownShadow = shadow.getElementById('drilldownBox')

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

  $('#viewMementoButton').click(function () {
    window.location = $(this).attr('alt')
  })
}

function replaceContentScriptImagesWithChromeExtensionImages () {
  document.getElementById('minkLogo').src = chrome.extension.getURL('images/mink_marvel_80.png')

  document.getElementById('archivelogo_ia').src = chrome.extension.getURL('images/archives/iaLogo.png')
  document.getElementById('archivelogo_ais').src = chrome.extension.getURL('images/archives/archiveisLogo.png')
  document.getElementById('archivelogo_ala').src = chrome.extension.getURL('images/archives/allListedArchives.png')
  document.getElementById('archivelogo_webcite').src = chrome.extension.getURL('images/archives/webcitelogo.png')
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
    chrome.runtime.sendMessage({method: 'openOptionsPage'})
  })
}

function bindViewButton () {
  var viewButton = $('#viewMementoButton')

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
    var shadow = document.getElementById('minkWrapper').shadowRoot
    var mementosDropdown = shadow.getElementById('mementosDropdown')
    var viewMementoButton = shadow.getElementById('viewMementoButton')
    var drilldownBox = shadow.getElementById('drilldownBox')

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
    var shadow = document.getElementById('minkWrapper').shadowRoot
    var mementosDropdown = shadow.getElementById('mementosDropdown')
    var viewMementoButton = shadow.getElementById('viewMementoButton')
    var drilldownBox = shadow.getElementById('drilldownBox')
    var drilldownTitle = shadow.getElementById('title_drilldown')
    var dropdownTitle = shadow.getElementById('title_dropdown')

    if (!dropdownTitle.classList.contains('disabled')) {
      mementosDropdown.className = 'dropdown hidden'
      viewMementoButton.className = 'dropdown hidden'
      shadow.getElementById('title_dropdown').className = ''
      drilldownBox.className = ''

      drilldownTitle.className = 'active'
    }
  }
}

function changeIconFor (obj, src) {
  $(obj).attr('src', src)
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.method === 'showViewingMementoInterface') {
      console.log('caught showViewingMementoInterface, tweak UI here')
    } else {
      console.log('caught message in minkui.html but did not react')
    }
  }
)

function displayAndHideShadowDOMElements (showElementsIds, hideElementsIds) {
  var shadow = document.getElementById('minkWrapper').shadowRoot

  var ee
  for (ee = 0; ee < showElementsIds.length; ee++) {
    shadow.getElementById(showElementsIds[ee]).classList.remove('hidden', 'nonArchiveNowInterface')
  }

  for (ee = 0; ee < hideElementsIds.length; ee++) {
    shadow.getElementById(hideElementsIds[ee]).classList.add('hidden', 'nonArchiveNowInterface')
  }
}

function bindArchiveNowButton () {
  $('#minkuiX #archiveNow').click(function () {
    var show = ['archiveNowInterface']
    var hide = ['archiveNow', 'steps']

    var shadow = document.getElementById('minkWrapper').shadowRoot
    var dropdownActive = shadow.getElementById('title_dropdown').classList.contains('active')
    var drilldownActive = shadow.getElementById('title_drilldown').classList.contains('active')

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
    var hide = ['archiveNowInterface']
    var show = ['archiveNow', 'steps']

    var shadow = document.getElementById('minkWrapper').shadowRoot
    var dropdownActive = shadow.getElementById('title_dropdown').classList.contains('active')
    var drilldownActive = shadow.getElementById('title_drilldown').classList.contains('active')

    if (dropdownActive) {
      show.push('mementosDropdown', 'viewMementoButton')
    } else if (drilldownActive) {
      show.push('drilldownBox')
    }

    displayAndHideShadowDOMElements(show, hide)
  })
}

function bindArchiveLogos () {
  var iaLogo = $('#archivelogo_ia')
  var aisLogo = $('#archivelogo_ais')
  var wcLogo = $('#archivelogo_webcite')

  var alaLogo = $('#archivelogo_ala') // All archives

  var openInNewTab = false

  $('.archiveLogo').click(function () {
    if ($(this).attr('src').indexOf('_success') > -1) { // Already archived, view
      return
    }

    var that = this
    var newSrc = $(this).attr('src').replace('.png', '_success.png')
    $(this).attr('src', chrome.extension.getURL('./images/spinner.gif'))

    var archiveLogoID = $(this).attr('id')
    var cb = function () { changeIconFor(that, newSrc) }

    if (archiveLogoID === 'archivelogo_ia') {
      archiveURI_archiveOrg(cb, openInNewTab)
    } else if (archiveLogoID === 'archivelogo_ais') {
      archiveURI_archiveDotIs(cb, openInNewTab)
    } else if (archiveLogoID === 'archivelogo_webcite') {
      archiveURI_webCite(cb, openInNewTab)
    } else if (archiveLogoID === 'archivelogo_ala') { // Async calls to 3 archives
      var ia_newSrc = $(iaLogo).attr('src').replace('.png', '_success.png')
      var ais_newSrc = $(aisLogo).attr('src').replace('.png', '_success.png')
      var wc_newSrc = $(wcLogo).attr('src').replace('.png', '_success.png')

      var ia_cb = function () {
        changeIconFor(iaLogo, ia_newSrc)
        changeArchiveAllIconWhenComplete(alaLogo)
      }
      var ais_cb = function () {
        changeIconFor(aisLogo, ais_newSrc)
        changeArchiveAllIconWhenComplete(alaLogo)
      }
      var wc_cb = function () {
        changeIconFor(wcLogo, wc_newSrc)
        changeArchiveAllIconWhenComplete(alaLogo)
      }

      $(iaLogo).attr('src', chrome.extension.getURL('./images/spinner.gif'))
      $(aisLogo).attr('src', chrome.extension.getURL('./images/spinner.gif'))
      $(wcLogo).attr('src', chrome.extension.getURL('./images/spinner.gif'))

      openInNewTab = true
      archiveURI_archiveOrg(ia_cb, openInNewTab)
      archiveURI_archiveDotIs(ais_cb, openInNewTab)
      archiveURI_webCite(wc_cb, openInNewTab)
    }
  })
}

var archivesFinished = 0
function changeArchiveAllIconWhenComplete (iconObj) {
  archivesFinished++
  if (archivesFinished >= 3) {
    $(iconObj).attr('src', chrome.extension.getURL('./images/archives/allListedArchives_success.png'))
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

if ($('#minkWrapper').length === 0) {
  if (debug) { console.log('appending HTML to Shadow DOM') }
  appendHTMLToShadowDOM()
} else {
  $('#minkWrapper').toggle()
}
