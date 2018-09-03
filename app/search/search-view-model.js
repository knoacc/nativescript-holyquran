const Observable = require("data/observable").Observable;
const observableArray = require("data/observable-array").ObservableArray;
const clipboardModule = require("nativescript-clipboard");
const socialShareModule = require("nativescript-social-share");
const Toast = require("nativescript-toast");

function SearchViewModel(database, verses) {

    const viewModel = new Observable();

    // data
    viewModel.isLoading = true;
    viewModel.verses = new observableArray(verses);

    // functions

    setVerses();

    function setVerses() {

        getBookmarksIDs().then((verseIDs) => {
            const verses = new observableArray();

            viewModel.verses.forEach((verse) => {

                verse.bookmarkClass = "c-bg-grey";

                if (verseIDs.includes(verse.numberInSurah.toString())) {
                    verse.bookmarkClass = "c-bg-lime";
                }

                verses.push(verse);
            });

            viewModel.set("verses", verses);
            viewModel.set("isLoading", false);

            //console.log("verse");
            //console.log(viewModel.verses);
        });
    }

    viewModel.copy = function (args) {
        const selected = args.object.bindingContext;

        clipboardModule.setText(selected.text).then(() => {
            Toast.makeText("Copied to clipboard").show();
        });
    };

    viewModel.share = function (args) {
        const selected = args.object.bindingContext;

        const footer = `(Holy Quran ${selected.chapter.number}:${selected.numberInSurah})`;
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

    function insertBookmark(verse) {
        database.execSQL("INSERT INTO bookmarks (chapterNumber, chapterName, chapterEnglishName, chapterEnglishNameTranslation, chapterType, text, textArabic, textUrdu, numberInSurah, juz, manzil, page, ruku, hizbQuarter, sajda) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [verse.chapter.number, verse.chapter.name, verse.chapter.englishName, verse.chapter.englishNameTranslation, verse.chapter.revelationType, verse.text, verse.textArabic, verse.textUrdu, verse.numberInSurah, verse.juz, verse.manzil, verse.page, verse.ruku, verse.hizbQuarter, verse.hizbQuarter]).then((id) => {
            console.log("insertBookmark SUCCESS!");
            setVerses();
        }, (error) => {
            console.log("insertBookmark ERROR", error);
        });
    }

    function removeBookmark(verse) {
        database.execSQL("DELETE FROM bookmarks WHERE chapterNumber=(?) AND numberInSurah=(?)", [verse.chapter.number, verse.numberInSurah]).then(() => {
            console.log("removeBookmark SUCCESS!");
            setVerses();
        }, (error) => {
            console.log("removeBookmark ERROR!");
        });
    }

    function hasBookmark(verse) {
        return new Promise((resolve, reject) => {
            database.all("SELECT id FROM bookmarks WHERE chapterNumber=(?) AND numberInSurah=(?)", [verse.chapter.number, verse.numberInSurah]).then((rows) => {
                resolve(rows.length ? true : false);
            }, (error) => {
                console.log("hasBookmark ERROR", error);
                resolve(false);
            });
        });
    }

    function getBookmarksIDs() {
        return new Promise((resolve, reject) => {
            database.all("SELECT numberInSurah FROM bookmarks").then((rows) => {

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

module.exports = SearchViewModel;
