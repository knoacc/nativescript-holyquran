const observable = require("data/observable");
const appSettings = require("application-settings");

const ENGLISH_TRANSLATION = "settings-translation-english";
const URDU_TRANSLATION = "settings-translation-urdu";
const LAST_READING_POINT = "settings-last-reading-point";

const settings = new observable.Observable();

Object.defineProperty(settings, "englishEnabled", {
    get: function () { return appSettings.getBoolean(ENGLISH_TRANSLATION, true); },
    set: function (value) { appSettings.setBoolean(ENGLISH_TRANSLATION, value); },
    enumerable: true,
    configurable: true
});

Object.defineProperty(settings, "urduEnabled", {
    get: function () { return appSettings.getBoolean(URDU_TRANSLATION, false); },
    set: function (value) { appSettings.setBoolean(URDU_TRANSLATION, value); },
    enumerable: true,
    configurable: true
});

Object.defineProperty(settings, "readingPointEnabled", {
    get: function () { return appSettings.getBoolean(LAST_READING_POINT, false); },
    set: function (value) { appSettings.setBoolean(LAST_READING_POINT, value); },
    enumerable: true,
    configurable: true
});

exports.SettingsViewModel = settings;
