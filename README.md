<h2 align="center">
 <a href="https://github.com/machawk1/mink"><img src="https://cdn.rawgit.com/machawk1/Mink/master/mink-plugin/images/mink_marvel_300.png" alt="Mink logo" /></a><br />Integrate the Live and Archived Web Viewing Experience</h2>

<p align="center">
  <a href="https://travis-ci.org/machawk1/mink"><img src="https://travis-ci.org/machawk1/Mink.svg" alt="TravisCI build status" /></a>
  <a href="http://standardjs.com/"><img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg" /></a>
  <br /><a href="http://matkelly.com/mink"><img src="https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_206x58.png"></a>
</p>


Mink is a Google Chrome extension to indicate that a page a user is viewing on the live web has an archived copy and to give the user access to the copy. If no copies exist, the extension provides one-button access to preserve the page in a select set of web archives and to easily view the page once it has been preserved.

##Install

The extension is available for download from the [Chrome Web Store](https://chrome.google.com/webstore/detail/mink/jemoalkmipibchioofomhkgimhofbbem)!

##Usage

The extension works by querying the archives when you browse the web. For each page you visit, Mink sends an asynchronous request to a Memento aggregator and displays the number of mementos (web pages for the URL in the archives) using a badge over the Mink/Memento icon in the browser's button bar.

###Selecting a Memento

For web pages with not many mementos, the dropdown menu is the most accessible way to view the memento in the web archive. To do this, click the Mink button bar icon, select the date/time from the dropdown and click the "View" button". When viewing a memento, selecting the icon again will return a different interface with a button to return to the live web.

###No mementos? No problem!

If no mementos exist in the archive, the extension will indicate this with a red "no mementos" icon and give the option to submit the URL to various archives for preservation.

## Examples
1. [A niche site with few mementos](https://github.com/machawk1/Mink/wiki/Examples#use-case-1-a-niche-site-with-few-mementos)
1. [A popular site with many mementos](https://github.com/machawk1/Mink/wiki/Examples#use-case-2-a-popular-site-with-many-mementos)


##License

GPLv2 
