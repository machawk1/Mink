<h2 align="center">
 <a href="https://github.com/machawk1/mink"><img src="https://github.com/machawk1/Mink/blob/main/meta/mink_marvel_300_noTrans.png" alt="Mink logo" /></a><br />Integrate the Live and Archived Web Viewing Experience</h2>

<p align="center">
  <a href="http://standardjs.com/"><img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg" /></a>
  <br /><a href="http://matkelly.com/mink"><img src="https://github.com/machawk1/Mink/blob/main/meta/chromeWebStore.png?raw=true"></a>
</p>


Mink is a Google Chrome extension that uses the [Memento protocol](https://tools.ietf.org/html/rfc7089) to indicate that a page a user is viewing on the live web has an archived copy and to give the user access to the copy. If no copies exist, the extension provides one-button access to preserve the page in various web archives and to easily view the page once it has been preserved.

## Install

The extension is available for download from the [Chrome Web Store](https://chrome.google.com/webstore/detail/mink/jemoalkmipibchioofomhkgimhofbbem)!

## Usage

The extension works by querying the archives when you browse the web. For each page you visit, Mink sends an asynchronous request to a Memento aggregator and displays the number of mementos (web pages for the URL in the archives) using a badge over the Mink/Memento icon in the browser's button bar.

### Selecting a Memento

For web pages with few mementos, the dropdown menu is the most accessible way to view the memento in a web archive (e.g., [Internet Archive's Wayback Machine](http://web.archive.org/)). To do this, click the Mink button bar icon, select the date/time from the dropdown and click the "View" button. When viewing a memento, selecting the icon again will return a different interface with a button to return to the live web.

### No mementos? No problem!

If no mementos exist in the archive, the extension will indicate this with a red "no mementos" icon and give the option to submit the URL to various archives for preservation.

## Examples
1. [A niche site with few mementos](https://github.com/machawk1/Mink/wiki/Examples#use-case-1-a-niche-site-with-few-mementos)
1. [A popular site with many mementos](https://github.com/machawk1/Mink/wiki/Examples#use-case-2-a-popular-site-with-many-mementos)

## Development

Chrome supports debugging extensions by loading them from the local file system. To do this, go to `More Tools > Extensions`, enabled the `Developer mode` switch, click the `Load unpacked` button, and select the `mink-plugin` directory in the working directory clone of this repository.

For packaging the extension and releasing a new version, enter the `mink-plugin` directory, type

<blockquote>zip -r /where/to/store/resulting/mink.zip *</blockquote>

...access the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard/) and upload the `.zip` to the Mink entry.

### Citing Project

This project was originally presented at the ACM/IEEE Joint Conference on Digital Libraries ([Read the PDF](https://matkelly.com/papers/2014_dl_mink.pdf)) and can be cited as follows:

> Mat Kelly, Michael L. Nelson, and Michele C. Weigle, __"Mink: Integrating the Live and Archived Web Viewing Experience Using Web Browsers and Memento,"__ In _Proceedings of the ACM/IEEE Joint Conference on Digital Libraries (JCDL)_, pages 469-470, London, England, September 2014.

```bib
@INPROCEEDINGS { kelly-dl2014-mink,
    AUTHOR = { Mat Kelly, Michael L. Nelson, and Michele C. Weigle },
    TITLE = { Mink: Integrating the Live and Archived Web Viewing Experience Using Web Browsers and Memento },
    BOOKTITLE = { Proceedings of the ACM/IEEE Joint Conference on Digital Libraries (JCDL) },
    YEAR = { 2014 },
    MONTH = { September },
    ADDRESS = { London, England },
    PAGES = {469--470},
    DOI = {10.1109/JCDL.2014.6970229}
}
```


## License

MIT
