![Creative Commons License](https://img.shields.io/badge/license-Creative%20Commons-success) ![In Development](https://img.shields.io/badge/status-Released-success) ![Code Coverage](https://img.shields.io/badge/code%20coverage-90%25-success)


<h1 align="center">DEMO CLEANUP</h1>
<p align="center">
This package contains a Lightning component and other support to help cleanup demos between demo presentations, dry runs, and tests.
</p>

![Demo Cleanup](/images/Demo_Cleanup.png)

![Demo Cleanup Progress](/images/Demo_Cleanup_Progress.png)

## Summary

I often find myself in a situation where I need to dust off a demo long after I originally presented it and have forgotten if certain records are required for the demo, were generated during my testing, or were created during the last presentation. This makes getting the demo in a clean state for the next presentation more time-consuming and risky.

This component simply executes a number of demo cleanup tasks based on criteria specified in a SOQL WHERE clause.  Optionally, the component will follow up the deletions with an invocation of a custom Apex class which can handle any other cleanup operations that do not involve simple deletions.

## Installation and Setup

Read the disclaimer below and click on the **Install the Package** link. This will install all the components, objects, and other metadata to your org.

Assign the `Demo Cleanup` permission set to the System Administrator or anyone else who needs to use the component.

Once the package is deployed, you will need to create a Lightning app page with the Lightning App Builder and drag the `Demo Cleanup` custom component on the page where you would like to place it.

Next, open the App Launcher and click on the `Demo Cleanup Tasks` tab, click the `New` button and supply an object API name, a description, and an optional SOQL WHERE clause which specifies which records of that object should be deleted. For each task, you can also choose to permanently the records, or keep them in the recycle bin. Repeat for all of the objects whose records you would like to delete.

![Demo Cleanup Task](/images/Demo_Cleanup_Task.png)

If you are familiar with [Apex](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_intro_what_is_apex.htm) you can modify the supplied `DemoCleanupCustomApex.runCustomApex` method to perform any other operations that can't be done with simple record deletions, such as activating or deactivating users.


## How to Deploy This Package to Your Org

I am a pre-sales Solutions Engineer for [Salesforce](https://www.salesforce.com) and I develop solutions for my customers to demonstrate the capabilities of the amazing Salesforce platform. *This package represents functionality that I have used for demonstration purposes  and the content herein is definitely not ready for actual production use; specifically, it has not been tested extensively nor has it been written with security and access controls in mind. By installing this package, you assume all risk for any consequences and agree not to hold me or my company liable.*  If you are OK with that ...

[Install the Package](https://login.salesforce.com/packaging/installPackage.apexp?p0=04t2E000003obwNQAQ)

## Acknowledgements

I was inspired by work done by Salesforce super-SE John Schillaci to create this component.

## Maintainer

[John Meyer / johnsfdemo](https://github.com/johnsfdemo)
