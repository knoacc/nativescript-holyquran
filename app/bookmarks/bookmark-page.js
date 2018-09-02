const app = require("application");
const BookmarksViewModel = require("./bookmark-page-model").BookmarksViewModel;
const Sqlite = require("nativescript-sqlite");

function onNavigatingTo(args) {
    const page = args.object;

    (new Sqlite("holyquran.db")).then((db) => {
        db.execSQL("CREATE TABLE IF NOT EXISTS bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, chapterNumber TEXT, chapterName TEXT, chapterEnglishName TEXT, chapterEnglishNameTranslation TEXT, chapterType TEXT, text TEXT, textArabic TEXT, textUrdu TEXT, numberInSurah TEXT, juz TEXT, manzil TEXT, page TEXT, ruku TEXT, hizbQuarter TEXT, sajda TEXT)").then((id) => {
            page.bindingContext = BookmarksViewModel(db);
        }, (error) => {
            console.log("CREATE TABLE ERROR", error);
        });
    }, (error) => {
        console.log("OPEN DB ERROR", error);
    });
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();

    sideDrawer.showDrawer();
}

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
