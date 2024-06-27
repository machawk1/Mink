/* global chrome, $ */

var debug = true

const tmDropdownString = '<option>&nbsp;&nbsp;&darr; Mink has TimeMaps for... &darr;</option>'
const tmDropdownNoTimemapsString = '<option>--- No TimeMaps available ---</option>'

function restoreOptions () {
  chrome.storage.local.get('ignorelist', function (items) {
    $(items.ignorelist).each(function (i, v) {
      $('#options').append(getListItemHTML(v, 'glyphicon-remove'))
    })
    updateSaveButtonStatus()
    updateRemoveAllIgnorelistButtonStatus()

    $('.remove').click(function () {
      if ($(this).hasClass('glyphicon-remove')) {
        $(this).parent().addClass('strike')
        $(this).toggleClass('glyphicon-remove glyphicon-ok')
      } else {
        $(this).toggleClass('glyphicon-ok glyphicon-remove')
        $(this).parent().removeClass('strike')
      }
      updateSaveButtonStatus()
      updateRemoveAllIgnorelistButtonStatus()
    })
  })

  chrome.storage.local.get('aggregators', function (ls) {
    let dropdownOptions = document.querySelector('#aggregator').options

    if (!ls.aggregator) {
      console.log('No aggregators listed in localStorage (yet)')
      return
    }
    for (let i = 0; i < dropdownOptions.length; i++) {
      if (dropdownOptions[i].value == ls.aggregators[0]) {
        document.querySelector('#aggregator').selectedIndex = i
        break
      }
    }
  })
}

function getListItemHTML (uri, classIn, buttonText) {
  if (!buttonText) {
    buttonText = ''
  }
  return `<li><button class="btn btn-default btn-xs glyphicon ${classIn} remove" type="button">${buttonText}</button><span>${uri}</span></li>`
}

function clearIgnorelist () {
  chrome.storage.local.set({ ignorelist: [] })
  document.location.reload()
}

function saveIgnorelist (dontReload) {
  const ignorelistJSON = {}
  const uris = []
  $('#options li:not(.strike) span').each(function () {
    uris.push($(this).text())
  })

  ignorelistJSON.ignorelist = uris
  chrome.storage.local.set(ignorelistJSON)
  $('.newEntry').removeClass('newEntry') // Disable indicator for unsaved data
  updateSaveButtonStatus()

  if (!dontReload) {
    document.location.reload()
  }
}

function saveAggregatorSource () {
  let dropdown = document.querySelector('#aggregator')
  let availableOptions = [dropdown.options[dropdown.selectedIndex].value]

  for (let i = 0; i < dropdown.options.length; i++) {
    if (!dropdown.options[i].disabled && i != dropdown.selectedIndex) {
      availableOptions.push(dropdown.options[i].value)
    }
  }
  if (debug) {
    console.log(`Setting aggregator chain to ${availableOptions.join(',')}`)
  }
  chrome.storage.local.set({ 'aggregators': availableOptions })
}

function updateSaveButtonStatus () {
  const saveIgnorelistButton = $('#saveIgnorelist')
  if ($('.glyphicon-ok').length > 0 || $('.newEntry').length > 0) {
    saveIgnorelistButton.removeAttr('disabled').removeClass('disabled')
  } else {
    saveIgnorelistButton.attr('disabled', 'disabled').addClass('disabled')
  }
}

function updateRemoveAllIgnorelistButtonStatus () {
  const clearIgnorelistButton = $('#clearIgnorelist')
  if (debug) {
    const lis = $('#options li')
    console.log(lis.length)
    console.log(lis)
  }
  if ($('#options li').length > 0) {
    clearIgnorelistButton.removeAttr('disabled').removeClass('disabled')
  } else {
    clearIgnorelistButton.attr('disabled', 'disabled').addClass('disabled')
  }
}

function createAddURIBinder () {
  $('#add').click(function () {
    addMinkIgnorelistToBeSavedLI()
    bindAddIgnorelistEntryUI()
  })
}

function bindAddIgnorelistEntryUI () {
  $('.uriTextField').keyup(function () {
    const uriFieldValue = $(this).val()
    if (uriFieldValue.length === 0) {
      $(this).parent().find('button.addToIgnorelist').attr('disabled', true)
    } else {
      $(this).parent().find('button.addToIgnorelist').removeAttr('disabled')
    }
  })
  $('.addToIgnorelist').click(addToIgnorelistToBeSaved)
  $('.cancelAddToIgnorelist').click(removeFromIgnorelistToBeSaved)
}

function addMinkIgnorelistToBeSavedLI (valIn) {
  if (!valIn) {
    valIn = ''
  }
  $('#options').prepend(`<li><input type="text" placeholder="http://"  class="uriTextField" id="newURI" "${valIn}"/><button class="addToIgnorelist" disabled>Add to Ignore List</button><button class="cancelAddToIgnorelist">Cancel</button></li>`)
}

function addToIgnorelistToBeSaved () {
  let uri = $(this).parent().find('.uriTextField').val()
  if (uri.substr(0, 4) !== 'http') {
    uri = `http://${uri}`
  }

  $(this).parent().replaceWith(getListItemHTML(uri, 'glyphicon-remove newItem'))
  const newItem = $('.newItem')
  newItem.click(removeEntry)
  newItem.removeClass('newItem').parent().addClass('newEntry')
  // $('.newEntry').append('<button  class="btn btn-default btn-xs glyphicon glyphicon-chevron-left" style="font-size: 12px; margin-left: 1.0em;">Nevermind</button>');
  updateSaveButtonStatus()
}

function removeFromIgnorelistToBeSaved () {
  $(this).parent().remove()
}

function removeEntry () {
  $(this).parent().remove()
  updateSaveButtonStatus()
}

function populatedCachedTimeMapsUI () {
  chrome.storage.local.get('timemaps', function (items) {
    if (debug) {
      console.log('items in the TM localstorage')
      console.log(items)
    }

    const tms = items.timemaps

    const keys = tms ? Object.keys(tms) : 0
    // let uriPluralityString = keys.length === 1 ? 'URI' : 'URIs'

    const cachedTimeMapsUI = $('#cachedTimemaps')
    if (keys.length) {
      cachedTimeMapsUI.append(tmDropdownString)
      for (let tm = 0; tm < keys.length; tm++) {
        let originalURI = tms[keys[tm]].original_uri
        if (!tms[keys[tm]].original_uri) {
          originalURI = keys[tm]
        }
        cachedTimeMapsUI.append(`<option>${originalURI}</option>`)
      }
      enableRemoveButtons(false, '#removeAllTMsFromCache')
      cachedTimeMapsUI.change(enableRemoveButtonsBasedOnDropdown)
    } else {
      cachedTimeMapsUI.append(tmDropdownNoTimemapsString)
      enableRemoveButtons(true, '#cachedTimemaps, #removeAllTMsFromCache')
    }
    enableRemoveButtonsBasedOnDropdown()
  })
}

function updateMementoCount () {
  chrome.storage.local.get('timemaps', function (items) {
    const selectedURI = document.querySelector('#cachedTimemaps').value
    const count = items.timemaps[selectedURI].mementos.list.length
    let plurality = 's'
    if (count === 1) {
      plurality = ''
    }
    document.querySelector('#mementoCount').innerHTML = `${count} memento${plurality} available`
  })
}

function resetMementoCount () {
  document.querySelector('#mementoCount').innerHTML = ''
}

function enableRemoveButtons (disable, additionalIdsIn) {
  let additionalIds = ''
  if (additionalIdsIn) {
    additionalIds = `,${additionalIdsIn}`
  }
  const buttonIds = `#removeSelectedTMFromCache, #removeSelectedTMFromCacheAndIgnorelist${additionalIds}`
  $(buttonIds).prop('disabled', disable)
}

function enableRemoveButtonsBasedOnDropdown () {
  const selectedIndex = $(this).find('option:selected').index()
  if (selectedIndex > 0) { // -1 would be valid with the verbose conditional
    enableRemoveButtons(false)
    updateMementoCount()
  } else { // Selected index is 0, disable
    enableRemoveButtons(true)
    resetMementoCount()
  }
}

function removeTMFromCache (originalURI) {
  chrome.storage.local.get('timemaps', function (items) {
    const tms = items.timemaps
    delete tms[originalURI]
    chrome.storage.local.set({ timemaps: tms },
      function () {
        console.log('Cache updated, updating UI')
        $('#cachedTimemaps').empty()
        populatedCachedTimeMapsUI()
      }
    )
  })
}

function clearTimemapCache () {
  chrome.storage.local.set({ timemaps: {} },
    function () {
      console.log('Remove all cached TMs')
      $('#cachedTimemaps').empty()
      populatedCachedTimeMapsUI()
    }
  )

  chrome.storage.local.set({ headers: {} },
    function () {
      console.log('Remove headers')
    }
  )
}

function saveAndCloseOptionsPanel () {
  saveIgnorelist()
  saveAggregatorSource()
  // window.close()
}

function restoreDefaults () {
  clearIgnorelist()
  clearTimemapCache()
  resetAggregatorSelection()
}


function resetAggregatorSelection () {
  let dropdown = document.querySelector('#aggregator')
  dropdown.selectedIndex = 0
  saveAggregatorSource()
}


function removeSelectedURIFromTimeMapCache () {
  const oURI = $('#cachedTimemaps option:selected').text()
  removeTMFromCache(oURI)
}

function addSelectedURIToIgnorelist () {
  const oURI = $('#cachedTimemaps option:selected').text()
  $('#options').append(`<li class="strike"><span>${oURI}</span>></li>`)
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.addEventListener('DOMContentLoaded', createAddURIBinder)
document.addEventListener('DOMContentLoaded', populatedCachedTimeMapsUI)

document.querySelector('#removeSelectedTMFromCache').addEventListener('click', removeSelectedURIFromTimeMapCache)

/* Not yet well-positioned in the GUI
document.querySelector('#removeSelectedTMFromCacheAndIgnorelist').addEventListener('click', function () {
  addSelectedURIToIgnorelist()
  const dontReloadAfterSavingIgnorelist = true
  saveIgnorelist(dontReloadAfterSavingIgnorelist)
  removeSelectedURIFromTimeMapCache()
})
 */

document.querySelector('#removeAllTMsFromCache').addEventListener('click', clearTimemapCache)
document.querySelector('#saveIgnorelist').addEventListener('click', saveIgnorelist)
document.querySelector('#clearIgnorelist').addEventListener('click', clearIgnorelist)
document.querySelector('#doneButton').addEventListener('click', saveAndCloseOptionsPanel)
document.querySelector('#restoreDefaultsButton').addEventListener('click', restoreDefaults)
