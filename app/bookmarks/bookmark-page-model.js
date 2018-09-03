const Observable = require("data/observable").Observable;
const observableArray = require("data/observable-array").ObservableArray;
const Settings = require("../settings/settings-view-model").SettingsViewModel;
const SelectedPageService = require("../shared/selected-page-service");
const searchBarModule = require("ui/search-bar");
const clipboardModule = require("nativescript-clipboard");
const socialShareModule = require("nativescript-social-share");
const Toast = require("nativescript-toast");
const dialog = require("ui/dialogs");

function BookmarksViewModel(database) {

    SelectedPageService.getInstance().updateSelectedPage("Bookmarks");

    const viewModel = new Observable();

    // data
    viewModel.filter = "";
    viewModel.isLoading = true;
    viewModel.verses = new observableArray();
    viewModel.versesAll = new observableArray();

    // functions

    viewModel.copy = function (args) {
        const selected = args.object.bindingContext;

        clipboardModule.setText(selected.text).then(() => {
            Toast.makeText("Copied to clipboard").show();
        });
    };

    viewModel.share = function (args) {
        const selected = args.object.bindingContext;

        const footer = `(Holy Quran ${selected.number}:${selected.numberInSurah})`;
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

    viewModel.removeBookmark = function (args) {
        const verse = args.object.bindingContext;

        dialog.confirm("Are you sure to delete this bookmark?").then((result) => {
            if (result) {
                database.execSQL("DELETE FROM bookmarks WHERE id=(?)", [verse.id]).then((id) => {
                    console.log("removeBookmark SUCCESS!");

                    getBookmarks();

                }, (error) => {
                    console.log("removeBookmark ERROR!");
                });
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
                if (item.text.match(regexp) || item.numberInSurah.toString().match(regexp) || item.englishName.match(regexp) || item.englishNameTranslation.match(regexp)) {
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

    function getBookmarks() {

        database.all("SELECT * FROM bookmarks ORDER BY id DESC").then((rows) => {

            const verses = new observableArray();

            for (const row in rows) {
                if (rows[row][1]) {
                    verses.push({
                        id: rows[row][0],
                        number: rows[row][1],
                        name: rows[row][2],
                        englishName: rows[row][3],
                        englishNameTranslation: rows[row][4],
                        revelationType: rows[row][5],
                        text: rows[row][6],
                        textArabic: rows[row][7],
                        textUrdu: rows[row][8],
                        numberInSurah: rows[row][9],
                        juz: rows[row][10],
                        manzil: rows[row][11],
                        page: rows[row][12],
                        ruku: rows[row][13],
                        hizbQuarter: rows[row][14],
                        sajda: rows[row][15],
                        bookmarkClass: "c-bg-lime",
                        englishEnabled: Settings.englishEnabled,
                        urduEnabled: Settings.urduEnabled
                    });
                }
            }

            viewModel.set("verses", verses);
            viewModel.set("versesAll", verses);
            viewModel.set("isLoading", false);

        }, (error) => {
            console.log("getBookmarks ERROR", error);
        });
    }

    getBookmarks();

    return viewModel;
}

exports.BookmarksViewModel = BookmarksViewModel;
