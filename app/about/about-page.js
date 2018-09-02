const app = require("application");
const SelectedPageService = require("../shared/selected-page-service");

function onNavigatingTo(args) {
    SelectedPageService.getInstance().updateSelectedPage("About");
}

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();

    sideDrawer.showDrawer();
}

exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;
