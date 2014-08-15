Mink
======

Chrome extension to indicate that a page a user is viewing on the live web has an archived copy and to give the user access to the copy. If no copies exist, the extension provides one-button access to preserve the page in a select set of web archives and to easily view the page once it has been preserved.

##Installation

The extension has been privately deployed for testing and will be deployed to the Chrome Web Store publicly soon (as in, well before Mid-September 2014).

##Usage

The extension works by querying the archives when you browse the web as usual. For each page you visit, Mink sends an asynchronous request to a Memento aggregator and displays the number of mementos (web pages for the URL in the archives) using a badge over the Mink/Memento icon in the bottom right of the browser.

###Selecting a Memento

For the case when a small number of mementos is displayed, the dropdown menu is the most accessible way to view the memento in the web archive. To do so, click the icon overlaying the bottom-right of the webpage, select the date/time from the dropdown and click the "View" button". When viewing a memento, selecting the icon again will return a different interface with a button to return to the live web.

If many mementos are returned, Mink fetches a subset of the mementos and give the user a means of fetching the datetimes for all mementos in the archive, which can be a time consuming task, as a recursive process is done to accumulate all mementos.

###No mementos? No problem!

If no mementos exist in the archive, the extension will say so and give the option to submit the URL to various archives for preservation.
