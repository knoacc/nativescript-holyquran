const Observable = require("data/observable").Observable;
const observableArray = require("data/observable-array").ObservableArray;
const Settings = require("../settings/settings-view-model").SettingsViewModel;
const SelectedPageService = require("../shared/selected-page-service");
const jsonReader = require("../shared/jsonReader");
const FrameModule = require("ui/frame");
const dialog = require("ui/dialogs");
const searchBarModule = require("ui/search-bar");
const Toast = require("nativescript-toast");
const appSettings = require("application-settings");

// declared here for cache reasons
const chapters = new observableArray([]);
let arabicChapters = new observableArray([]);
let urduChapters = new observableArray([]);

function HomeViewModel() {
    SelectedPageService.getInstance().updateSelectedPage("Home");

    const viewModel = new Observable();

    // data
    viewModel.filter = "";
    viewModel.isLoading = true;
    viewModel.chapters = new observableArray([]);

    if (chapters.length && arabicChapters.length) {
        viewModel.set("chapters", chapters);
        viewModel.set("isLoading", false);
    }
    else {
        console.log("loading data");

        jsonReader.readJSON("data/en.saheeh.json").then((english) => {
            jsonReader.readJSON("data/quran-simple-enhanced.json").then((arabic) => {
                jsonReader.readJSON("data/ur.jalandhry.json").then((urdu) => {

                    arabicChapters = arabic.data.surahs;
                    urduChapters = urdu.data.surahs;

                    english.data.surahs.forEach((chapter) => {
                        chapters.push(chapter);
                    });

                    viewModel.set("chapters", chapters);
                    viewModel.set("isLoading", false);

                    restoreLastReadingPoint();

                }, (error) => {
                    dialog.alert({
                        message: error,
                        okButtonText: "OK"
                    });
                });

            }, (error) => {
                dialog.alert({
                    message: error,
                    okButtonText: "OK"
                });
            });
        }, (error) => {
            dialog.alert({
                message: error,
                okButtonText: "OK"
            });
        });
    }

    // functions

    viewModel.onItemTap = function (args) {
        viewModel.goToChapter(args.index);
    };

    viewModel.goToChapter = function (index) {
        const chapter = this.chapters.getItem(index);
        const chapterArabic = arabicChapters[chapter.number - 1];
        const chapterUrdu = urduChapters[chapter.number - 1];

        const chapterData = mergeVerses(chapter, chapterArabic, chapterUrdu);

        FrameModule.topmost().navigate({
            moduleName: "details/details",
            context: { chapter: chapterData },
            animated: true,
            transition: "curlDown",
            clearHistory: false
        });
    };

    function restoreLastReadingPoint() {
        if (Settings.readingPointEnabled) {
            if (appSettings.hasKey("last_chapter") && appSettings.hasKey("last_verse")) {
                viewModel.set("isLoading", true);
                viewModel.goToChapter(appSettings.getNumber("last_chapter") - 1);
            }
        }
    }

    function mergeVerses(chapter, chapterArabic, chapterUrdu) {
        const chapterData = chapter;

        chapterData.verses = [];

        chapter.ayahs.forEach((verse, index) => {
            verse.textArabic = chapterArabic.ayahs[index].text;
            verse.textUrdu = chapterUrdu.ayahs[index].text;
            verse.chapterNumber = chapter.number;
            verse.englishEnabled = Settings.englishEnabled;
            verse.urduEnabled = Settings.urduEnabled;

            chapterData.verses.push(verse);
        });

        return chapterData;
    }

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

            chapters.forEach((item) => {
                if (item.englishName.match(regexp) || item.englishNameTranslation.match(regexp) || item.number.toString().match(regexp)) {
                    items.push(item);
                }
            });

            return items;
        }

        return chapters;
    }

    viewModel.on(Observable.propertyChangeEvent, (e) => {
        if (e.propertyName === "filter") {
            viewModel.set("chapters", search());
        }
    });

    viewModel.searchTranslations = function () {

        const PromptOptions = {
            title: "Search",
            defaultText: "",
            message: "Type Translation Search Keyword",
            okButtonText: "Search",
            cancelButtonText: "Cancel",
            cancelable: true
        };

        dialog.prompt(PromptOptions).then((response) => {
            if (response.result && response.text.trim().length) {

                const regexp = new RegExp(response.text.trim(), "i");

                let isFound = false;

                const verses = [];

                viewModel.set("isLoading", true);

                chapters.forEach((chapter) => {
                    const chapterArabic = arabicChapters[chapter.number - 1];
                    const chapterUrdu = urduChapters[chapter.number - 1];

                    chapter.ayahs.forEach((verse, index) => {
                        if (verse.text.match(regexp)) {

                            isFound = true;

                            verse.chapter = {};

                            verse.chapter.number = chapter.number;
                            verse.chapter.name = chapter.name;
                            verse.chapter.englishName = chapter.englishName;
                            verse.chapter.englishNameTranslation = chapter.englishNameTranslation;
                            verse.chapter.revelationType = chapter.revelationType;
                            verse.textArabic = chapterArabic.ayahs[index].text;
                            verse.textUrdu = chapterUrdu.ayahs[index].text;
                            verse.chapterNumber = chapter.number;
                            verse.englishEnabled = Settings.englishEnabled;
                            verse.urduEnabled = Settings.urduEnabled;

                            verses.push(verse);
                        }
                    });
                });

                viewModel.set("isLoading", false);

                if (isFound) {
                    FrameModule.topmost().navigate({
                        moduleName: "search/search-page",
                        context: { verses: verses },
                        animated: true,
                        transition: "curlDown",
                        clearHistory: false
                    });
                }
                else {
                    Toast.makeText("No verses found!").show();
                }

            }
        });
    };

    return viewModel;
}

module.exports = HomeViewModel;
