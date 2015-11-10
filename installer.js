require('package-script').spawn([
    {
        command: "npm",
        args: ["install", "-g", "grunt-cli"]
    }
]);

require('node_modules/grunt-protractor-runner/scripts/webdriver-manager-update');