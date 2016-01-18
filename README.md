![Mink Logo](./mink-plugin/images/mink_marvel_300.png)


Mink is a Google Chrome extension to indicate that a page a user is viewing on the live web has an archived copy and to give the user access to the copy. If no copies exist, the extension provides one-button access to preserve the page in a select set of web archives and to easily view the page once it has been preserved.

##Installation

The extension is publicly available from the [Chrome Web Store](https://chrome.google.com/webstore/detail/mink/jemoalkmipibchioofomhkgimhofbbem)!

##Usage

The extension works by querying the archives when you browse the web as usual. For each page you visit, Mink sends an asynchronous request to a Memento aggregator and displays the number of mementos (web pages for the URL in the archives) using a badge over the Mink/Memento icon in the bottom right of the browser.

###Selecting a Memento

For the case when a small number of mementos is displayed, the dropdown menu is the most accessible way to view the memento in the web archive. To do so, click the Mink button bar icon, select the date/time from the dropdown and click the "View" button". When viewing a memento, selecting the icon again will return a different interface with a button to return to the live web.

###No mementos? No problem!

If no mementos exist in the archive, the extension will indicate this with a red "no mementos" icon and give the option to submit the URL to various archives for preservation.

## Examples

### Use Case 1: A niche site with few mementos

1. After installing Mink, visit a web page and note the badge on the Mink button bar icon indicating the number of mementos (archived captures over time) available.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple2.0/1.png)
2. Clicking on the icon reveals the Mink interface.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple2.0/2.png)
3. Select the dropdown list to display the captures available.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple2.0/3.png)
4. Select a time and choose the View button to view a memento.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple2.0/4.png)
5. You will then be viewing an archived version of the web page on the live web!
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple2.0/5.png)
6. Select the Mink icon again to reveal the interface to return to the live web.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple2.0/6.png)

### Use Case 2: A popular site with many mementos

1. After installing Mink, visit a very popular web page (one that is likely to have many captures, e.g., cnn.com) and noticed the "999+" badge, indicating that many archive captures (mementos) are available.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/complex2.0/1.png)
2. Clicking the Mink icon, displays the date-based "Miller Columns" of the many mementos.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/complex2.0/2.png)
3. The date-based drilldown list allows you to easily select the memento with date and time you desire. This interface is also available for web pages with fewer mementos
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/complex2.0/3.png)
4. If no mementos exist or you would like to create a capture of the current web page, clicking the "Archive Page To..." button will display one-click submission to the supported archives (current Internet Archive and Archive.is).
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/complex2.0/4.png)