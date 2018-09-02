const app = require("application");

const Settings = require("./settings-view-model").SettingsViewModel;

function onNavigatingTo(args) {
    const page = args.object;

    page.bindingContext = Settings;
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
