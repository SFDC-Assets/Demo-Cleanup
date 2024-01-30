# FOR MAINTAINERS

I, John Meyer, the original author of these components, have retired from a wonderful nine-year career at Salesforce and will no longer be working on them, but I hope someone out there will find this package useful, if only to see some interesting Salesforce programming patterns.

To that end, I have tried to build an easy-to-use development environment using the [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) tools (possibly and hopefully in conjunction with the [Visual Studio Code extensions](https://developer.salesforce.com/tools/vscode/en/vscode-desktop/desktop-intro) or [Code Builder](https://developer.salesforce.com/tools/vscode/en/codebuilder/about)) in the hopes that future maintainers will have an easier time of it. This file documents some of things I have built for maintainers.

## Scratch Org Environment

In the `scripts` folder you will some shell scripts for creating a scratch org a package, and package versions, along with other miscellaneous tools. In order to use these you must first have authenticated into your dev hub and assigned it an alias. These scripts use my alias, `ComponentsPlayground`, but you may choose whatever alias you wish; just make sure you edit the scripts below to use the right name.

Also, each of the following scripts is intended to be run from the top-level directory of this repo. For example, `CreateScratchOrg.sh` needs to be called with
```
% scripts/CreateScratchOrg.sh
```

### CreateScratchOrg.sh

This script will create a scratch org, push the component metadata, create test data, and set up a test environment for you. The test environment includes an app called `Demo Cleanup Testbed` and its associated tab, along with a permission set called `Demo Reset Tools Tester`, which will be assigned to the System Administrator of the scratch org. It is important to inspect the variable `devHubUserName` in this script and set it to the correct value for your dev hub.

After you run this script, you might want to perform the following post-installation tasks:
-   In your personal settings, go to `Display and Layout` -> `Customize My Pages` and deselect `Make Setup My Default Landing Page`.
-   From the app menu, bring up the `Demo Cleanup Testbed` app. Go to the `Demo Cleanup Tasks` tab and select and pin the `All` list view.

### RebuildSampleData.sh

This script simply runs the Apex script that creates and populates the scratch org with sample data. Useful for when you have cleaned up all those records and still have more testing to do.

### CreatePackage.sh

This script will create a new package in your dev hub containing these components. It is important to inspect the variable `devHubUserName` in this script and set it to the correct value for your dev hub.

### CreatePackageVersion.sh

This script will create a new package version in your dev hub. It is important to inspect the variable `devHubUserName` in this script and set it to the correct value for your dev hub. Make sure that you update the version number in `force-app/main/default/lwc/demoCleanupHelpModal/demoCleanupHelpModal.js` and in `sfdx-project.json` before you run this script.

### DeleteAllScratchOrgs.sh

This script will delete all the scratch orgs associated with your dev hub. This may be useful for cleaning house. It is important to inspect the variable `devHubUserName` in this script and set it to the correct value for your dev hub.

### Subscribers.sh

This script will show a list of all packages associated with your dev hub and the number of times they have been installed. Useful for Salesforce SEs who are bucking for promotion or anyone else who might want numbers to show what impact their packages are having.