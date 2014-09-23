![Mink Logo](https://github.com/machawk1/Mink/blob/master/mink-plugin/images/minkLogo_300.png)


Mink is a Google Chrome extension to indicate that a page a user is viewing on the live web has an archived copy and to give the user access to the copy. If no copies exist, the extension provides one-button access to preserve the page in a select set of web archives and to easily view the page once it has been preserved.

##Installation

The extension is publicly available from the [Chrome Web Store](https://chrome.google.com/webstore/detail/mink/jemoalkmipibchioofomhkgimhofbbem)!

##Usage

The extension works by querying the archives when you browse the web as usual. For each page you visit, Mink sends an asynchronous request to a Memento aggregator and displays the number of mementos (web pages for the URL in the archives) using a badge over the Mink/Memento icon in the bottom right of the browser.

###Selecting a Memento

For the case when a small number of mementos is displayed, the dropdown menu is the most accessible way to view the memento in the web archive. To do so, click the icon overlaying the bottom-right of the webpage, select the date/time from the dropdown and click the "View" button". When viewing a memento, selecting the icon again will return a different interface with a button to return to the live web.

If many mementos are returned, Mink fetches a subset of the mementos and give the user a means of fetching the datetimes for all mementos in the archive, which can be a time consuming task, as a recursive process is done to accumulate all mementos.

###No mementos? No problem!

If no mementos exist in the archive, the extension will say so and give the option to submit the URL to various archives for preservation.

## Examples

### Use Case 1: A niche site with few mementos

1. After installing Mink, visit a web page and note the icon overlaying the page in the bottom right corner indicating the number of mementos (archived captures over time) available.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple/1.png)
2. Clicking on the icon reveals the Mink interface.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple/2.png)
3. Select the dropdown list to display the captures available.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple/3.png)
4. Select a time and choose the View button.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple/4.png)
5. You are then viewing an archived version of the web page on the live web!
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple/5.png)
6. Select the Mink icon again to review the interface to return to the live web.
![](https://github.com/machawk1/Mink/blob/master/meta/screenshots/simple/6.png)
