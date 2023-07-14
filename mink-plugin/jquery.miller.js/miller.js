(function ($) {
  const methods = {
    'getPath': function () {
      let path = []

      $.each($(this).find('div.path span'), function (key, node) {
          path.push({ 'id': $(node).data('id'), 'name': $(node).text() })
        }
      )

      return path
    }
  }

  $.fn.miller = function (mixed) {
    if ( methods[mixed] ) {
      return methods[mixed].apply(this, Array.prototype.slice.call(arguments, 1))
    } else {
      let miller = this
      let hasFocus = false
      let currentAjaxRequest = null
      let settings = $.extend(true, {
            'url': function (id) { return id },
            'tabindex': 0,
            'minWidth': 40,
            'carroussel': false,
            'toolbar': {
              'options': {}
            },
            'pane': {
              'options': {}
            }
          },
          mixed
        )

      if (!miller.attr('tabindex')) {
        miller.attr('tabindex', settings.tabindex)
      }

      miller
        .addClass('miller')
        .focus(function () { hasFocus = true })
        .blur(function () { hasFocus = false })

      let path = $('<div>', { 'class': 'path' }).appendTo(miller)
      let columns = $('<div>', { 'class': 'columns' }).appendTo(miller)

      let toolbar = null

      if (!$.isEmptyObject(settings.toolbar.options)) {
        let toolbar = $('<div>', { 'class': 'toolbar' })
          .appendTo(miller)
      }

      let currentLine = null

      // document.addEventListener('keydown', (event) => {
      $(document).keypress(function (event) {
          if (hasFocus && currentLine && event.which != 37 && event.which != 38 && event.which != 39 && event.which != 40) {
            var newCurrentLine = currentLine.parent().children().filter(function () { return $(this).text().match(new RegExp('^' + String.fromCharCode(event.which))) }).first()

            if (newCurrentLine.length) {
              currentLine = newCurrentLine.click()
            }
          }
        }
      )

      $(document).keydown(function (event) {
          if (hasFocus && currentLine && (event.which == 37 || event.which == 38 || event.which == 39 || event.which == 40)) {
            let newCurrentLine = []
            let scrollTop = currentLine.parent().scrollTop()

            switch (event.which) {
              case 37:
                newCurrentLine = currentLine.parent().prev().prev().find('li.parentSelected')
                break

              case 38:
                newCurrentLine = currentLine.prev()

                if (!newCurrentLine.length && settings.carroussel) {
                  newCurrentLine = currentLine.parent().find('li:last')
                  scrollTop = newCurrentLine.position().top
                }
                break

              case 39:
                newCurrentLine = currentLine.parent().next().next().find('li:first')
                break

              case 40:
                newCurrentLine = currentLine.next()

                if (!newCurrentLine.length && settings.carroussel) {
                  newCurrentLine = currentLine.parent().find('li:first')
                  scrollTop = 0
                }
                break
            }

            if (newCurrentLine.length && !newCurrentLine.parent().hasClass('pane')) {
              currentLine = newCurrentLine.click()
            }

            return false
          }
        }
      )

      let removeNextColumns = function () {
          let line = $(this)

          let column = line.parent()

          column.nextAll().slice(1).remove()

          column
            .find('li')
            .removeClass('selected parentSelected')

          line.addClass(line.hasClass('parent') ? 'parentSelected' : 'selected')

          let node = $('<span>', { 'text': line.text() })
            .data('id', line.data('id'))
            .click(function () {
                columns
                  .children()
                  .slice((($(this).index() * 2) + 4))
                  .remove()
                columns
                  .children('ul:last')
                  .find('li')
                  .removeClass('parentSelected')
                path
                  .children()
                  .slice($(this).index() + 1)
                  .remove()
              }
            )
            .appendTo(path)

          let child = column.index()

          child -= (child - (child / 2))

          path
            .scrollLeft(node.position().left)
            .children()
            .slice(child, -1)
            .remove()
        }

      let buildColumn = function (lines) {
          if (lines == null) {
            $('li.parentLoading').remove()
          } else {
            if (currentLine && toolbar) {
              toolbar.children().remove()

              $.each(settings.toolbar.options, function (key, callback) {
                  $('<span>', { 'text': key })
                    .click(function () { callback.call(miller, currentLine.data('id')) })
                    .appendTo(toolbar)
                }
              )
            }

            if (currentLine) {
              let currentColumn = currentLine.parent()
              let scroll = 0
              let scrollTop = currentColumn.scrollTop()
              let topOfCurrentLine = currentLine.position().top

              if (topOfCurrentLine < 0) {
                scroll = topOfCurrentLine
              } else {
                let bottomOfCurrentLine = currentLine.position().top + currentLine.height()
                let heightOfCurrentColumn = currentColumn.height()

                if (bottomOfCurrentLine > heightOfCurrentColumn) {
                  scroll = bottomOfCurrentLine - heightOfCurrentColumn
                }
              }

              currentColumn.scrollTop(scrollTop + scroll)
            }

            let width = 0
            let lastGrip = columns.children('div.grip:last')[0]

            if (lastGrip) {
              lastGrip = $(lastGrip)
              width = lastGrip.position().left + lastGrip.width() + columns.scrollLeft()
            }

            if (lines.length <= 0) {
              let line = $('li.parentLoading')
                .removeClass('parent')
                .addClass('selected')

              if (!$.isEmptyObject(settings.pane.options)) {
                let pane = $('<ul>')
                  .css({ 'top': 0, 'left': width })
                  .addClass('pane')

                let id = line.data('id')

                $.each(settings.pane.options, function (key, callback) {
                    $('<li>', { 'text': key })
                      .click(function () { callback.call(miller, currentLine.data('id')) })
                      .appendTo(pane)
                  }
                )

                columns
                  .append(pane)
                  .scrollLeft(width + pane.width())
              }
            } else {
              $('li.parentLoading').addClass('parentSelected')

              let column = $('<ul>').css({ 'top': 0, 'left': width })

              $.each(lines, function (id, data) {
                  let line = $('<li>', { 'text': data['name'] })
                    .data('id', data['id'])
                    .click(removeNextColumns)
                    .click(getLines)
                    .appendTo(column)

                  if (data['parent']) {
                    line.addClass('parent')
                  }
                }
              )

              columns
                .append(column)
                .scrollLeft(width += column.width())
                .append(
                  $('<div>', { 'class': 'grip' })
                    .css({ 'top': 0, 'left': width })
                    .mousedown(function (event) {
                        let x = event.pageX
                        let cursor = columns.css('cursor')

                        columns
                          .css('cursor', 'col-resize')
                          .mousemove(function (event) {
                              let delta = event.pageX - x
                              let newWidth = column.width() + delta

                              if (newWidth > settings.minWidth) {
                                column
                                  .width(newWidth)
                                  .nextAll()
                                  .each(function () {
                                      $(this).css('left', $(this).position().left + delta + columns.scrollLeft())
                                    }
                                  )
                              }

                              x = event.pageX
                            }
                          )
                          .mouseup(function () {
                              columns
                                .off('mousemove')
                                .css('cursor', cursor)
                            }
                          )
                      }
                    )
                )
            }
          }
        }

      let getLines = function (event) {
          if (currentAjaxRequest) {
            currentAjaxRequest.abort()
          }

          currentLine = $(event.currentTarget)
            .removeClass('parentSelected')
            .addClass('parentLoading')

          currentAjaxRequest = $.getJSON(settings.url($(this).data('id')), buildColumn)
            .always(function () {
                currentLine
                  .removeClass('parentLoading')

                currentAjaxRequest = null
              }
            )
            .fail(function () {})

        }

      $.getJSON(settings.url(), buildColumn)

      return miller
    }
  }
})(jQuery)
