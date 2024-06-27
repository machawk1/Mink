<h2 align="center">
 <a href="https://github.com/machawk1/mink"><img src="https://github.com/machawk1/Mink/blob/main/meta/mink_marvel_300_noTrans.png?raw=true" alt="Mink logo" /></a><br />Integrate the Live and Archived Web Viewing Experience</h2>

<p align="center">
  <a href="http://standardjs.com/"><img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg" /></a>
  <br /><a href="http://matkelly.com/mink"><img src="https://github.com/machawk1/Mink/blob/main/meta/chromeWebStore.png?raw=true"></a>
</p>


Mink is a Google Chrome extension that uses the [Memento protocol](https://tools.ietf.org/html/rfc7089) to indicate that a page a user is viewing on the live web has an archived copy and to give the user access to the copy. If no copies exist, the extension provides one-button access to preserve the page in various web archives and to easily view the page once it has been preserved.

## Features

- Seemlessly see how well-archived a live web page is while browsing.
- Using the interface, quickly navigate to past captures of the page and traverse available captures from multiple web archive.
- No captures? No problem! With a single button click, Mink will submit the web page you are currently viewing to multiple web archives.
- Too many captures? When the set gets large, Mink intutitively organizes the set of captures for easy, hierarchical, time-based selection.

## Installation

* Go to the [Chrome Web Store](https://chrome.google.com/webstore/detail/mink/jemoalkmipibchioofomhkgimhofbbem)
* Click "Add to Chrome" to install Mink.
* Once installed, click the Mink icon in the Chrome toolbar to see how well-archived the current page is and navigate to the past.

## Usage

The extension works by querying the archives when you browse the web. For each page you visit, Mink sends an asynchronous request to a Memento aggregator and displays the number of mementos (web pages for the URL in the archives) using a badge over the Mink/Memento icon in the browser's button bar.

### Selecting a Memento

For web pages with few mementos, the dropdown menu is the most accessible way to view the memento in a web archive (e.g., [Internet Archive's Wayback Machine](http://web.archive.org/)). To do this, click the Mink button bar icon, select the date/time from the dropdown and click the "View" button. When viewing a memento, selecting the icon again will return an interface that allows you to navigate to other mementos or quickly return to the live web.

### No mementos? No problem!

If no mementos exist in the archive, the extension will indicate this with a red "no mementos" icon and give the option to submit the URL to various web archives for preservation.

## Examples
1. [A niche site with few mementos](https://github.com/machawk1/Mink/wiki/Examples#use-case-1-a-niche-site-with-few-mementos)
1. [A popular site with many mementos](https://github.com/machawk1/Mink/wiki/Examples#use-case-2-a-popular-site-with-many-mementos)

## Development

Chrome supports debugging extensions by loading them from the local file system. To do this, go to `Window > Extensions`, enabled the `Developer mode` switch, click the `Load unpacked` button, and select the `mink-plugin` directory in the working directory clone of this repository.

For packaging the extension and releasing a new version, enter the `mink-plugin` directory, type

<blockquote>zip -r /where/to/store/resulting/mink.zip *</blockquote>

...access the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard/) and upload the `.zip` to the Mink entry.

## Configuration

Mink is configurable to a variety of Memento aggregators. To customize this and other options including TimeMap caching setting (for efficient querying), Ignore Lists (for sites where you don't want Mink to run), etc., right click on the Mink icon and select Options.

# Contributing

Contributions welcomed. Please see the (to-be-created) CONTRIBUTING.md file in this repository for more information.

### Citing Project

This project was originally presented at the ACM/IEEE Joint Conference on Digital Libraries ([Read the PDF](https://matkelly.com/papers/2014_dl_mink.pdf)) and can be cited as follows:

> Mat Kelly, Michael L. Nelson, and Michele C. Weigle, __"Mink: Integrating the Live and Archived Web Viewing Experience Using Web Browsers and Memento,"__ In _Proceedings of the ACM/IEEE Joint Conference on Digital Libraries (JCDL)_, pages 469-470, London, England, September 2014.

```bib
@INPROCEEDINGS { kelly-dl2014-mink,
    AUTHOR = { Mat Kelly and Michael L. Nelson and Michele C. Weigle },
    TITLE = { Mink: Integrating the Live and Archived Web Viewing Experience Using Web Browsers and Memento },
    BOOKTITLE = { Proceedings of the ACM/IEEE Joint Conference on Digital Libraries (JCDL) },
    YEAR = { 2014 },
    MONTH = { 9 },
    ADDRESS = { London, UK },
    PAGES = {469--470},
    DOI = {10.1109/JCDL.2014.6970229}
}
```


## License

MIT
