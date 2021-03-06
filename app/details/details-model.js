const Observable = require("data/observable").Observable;
const observableArray = require("data/observable-array").ObservableArray;
const searchBarModule = require("ui/search-bar");
const clipboardModule = require("nativescript-clipboard");
const socialShareModule = require("nativescript-social-share");
const Toast = require("nativescript-toast");
const appSettings = require("application-settings");
const Settings = require("../settings/settings-view-model").SettingsViewModel;

function DetailsViewModel(database, chapter) {

    const viewModel = new Observable();

    // data
    viewModel.filter = "";
    viewModel.isLoading = true;
    viewModel.chapter = chapter;
    viewModel.verses = new observableArray(chapter.verses);
    viewModel.versesAll = new observableArray(chapter.verses);

    setVerses();

    function setVerses() {

        getBookmarksIDs().then((verseIDs) => {
            const verses = new observableArray();

            chapter.verses.forEach((verse) => {

                verse.bookmarkClass = "c-bg-grey";

                if (verseIDs.includes(verse.numberInSurah.toString())) {
                    verse.bookmarkClass = "c-bg-lime";
                }

                verses.push(verse);
            });

            viewModel.set("verses", verses);
            viewModel.set("versesAll", verses);

            viewModel.set("isLoading", false);
        });
    }

    // functions

    viewModel.onListViewLoaded = function (args) {
        const listView = args.object;

        if (Settings.readingPointEnabled) {
            if (appSettings.hasKey("last_chapter") && appSettings.hasKey("last_verse")) {
                if (chapter.number === appSettings.getNumber("last_chapter")) {
                    listView.scrollToIndex(appSettings.getNumber("last_verse"));
                }
            }
        }
    };

    viewModel.onItemLoading = function (args) {
        const index = args.index;

        appSettings.setNumber("last_chapter", chapter.number);
        appSettings.setNumber("last_verse", index - 1);
    };

    viewModel.copy = function (args) {
        const selected = args.object.bindingContext;

        clipboardModule.setText(selected.text).then(() => {
            Toast.makeText("Copied to clipboard").show();
        });
    };

    viewModel.share = function (args) {
        const selected = args.object.bindingContext;

        const footer = `(Holy Quran ${selected.chapterNumber}:${selected.numberInSurah})`;
        let text = `${selected.textArabic}\n\n`;

        if (selected.urduEnabled) {
            text += `${selected.textUrdu}\n\n`;
        }

        if (selected.englishEnabled) {
            text += `${selected.text}\n\n`;
        }

        text += footer;

        socialShareModule.shareText(text);
    };

    viewModel.toggleBookmark = function (args) {
        const verse = args.object.bindingContext;

        hasBookmark(verse).then((value) => {
            if (value) {
                removeBookmark(verse);
            }
            else {
                insertBookmark(verse);
            }
        });
    };

    viewModel.searchBarLoaded = function (args) {
        const searchBar = args.object;

        // clear autofocus
        if (searchBar.ios) {
            searchBar.ios.endEditing(true);
        }
        else if (searchBar.android) {
            searchBar.android.clearFocus();
        }

        // hide keyboard if search-bar is cleared
        searchBar.on(searchBarModule.SearchBar.clearEvent, () => {
            setTimeout(() => {
                searchBar.dismissSoftInput();
            }, 10);
        });
    };

    function search() {
        const filter = viewModel.filter.trim();

        if (filter) {
            const regexp = new RegExp(filter, "i");

            const items = new observableArray([]);

            viewModel.versesAll.forEach((item) => {
                if (item.text.match(regexp) || item.numberInSurah.toString().match(regexp)) {
                    items.push(item);
                }
            });

            return items;
        }

        return viewModel.versesAll;
    }

    viewModel.on(Observable.propertyChangeEvent, (e) => {
        if (e.propertyName === "filter") {
            viewModel.set("verses", search());
        }
    });

    function insertBookmark(verse) {
        database.execSQL("INSERT INTO bookmarks (chapterNumber, chapterName, chapterEnglishName, chapterEnglishNameTranslation, chapterType, text, textArabic, textUrdu, numberInSurah, juz, manzil, page, ruku, hizbQuarter, sajda) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [chapter.number, chapter.name, chapter.englishName, chapter.englishNameTranslation, chapter.revelationType, verse.text, verse.textArabic, verse.textUrdu, verse.numberInSurah, verse.juz, verse.manzil, verse.page, verse.ruku, verse.hizbQuarter, verse.hizbQuarter]).then((id) => {
            console.log("insertBookmark SUCCESS!");
            setVerses();
        }, (error) => {
            console.log("insertBookmark ERROR", error);
        });
    }

    function removeBookmark(verse) {
        database.execSQL("DELETE FROM bookmarks WHERE chapterNumber=(?) AND numberInSurah=(?)", [chapter.number, verse.numberInSurah]).then(() => {
            console.log("removeBookmark SUCCESS!");
            setVerses();
        }, (error) => {
            console.log("removeBookmark ERROR!");
        });
    }

    function hasBookmark(verse) {
        return new Promise((resolve, reject) => {
            database.all("SELECT id FROM bookmarks WHERE chapterNumber=(?) AND numberInSurah=(?)", [chapter.number, verse.numberInSurah]).then((rows) => {
                resolve(rows.length ? true : false);
            }, (error) => {
                console.log("hasBookmark ERROR", error);
                resolve(false);
            });
        });
    }

    function getBookmarksIDs() {
        return new Promise((resolve, reject) => {
            database.all("SELECT numberInSurah FROM bookmarks WHERE chapterNumber=(?)", [chapter.number]).then((rows) => {

                const verseIDs = [];

                for (const row in rows) {
                    if (rows[row][0]) {
                        verseIDs.push(rows[row][0]);
                    }
                }

                resolve(verseIDs);
            }, (error) => {
                console.log("getBookmarksIDs ERROR", error);
                resolve([]);
            });
        });
    }

    return viewModel;
}

module.exports = DetailsViewModel;
