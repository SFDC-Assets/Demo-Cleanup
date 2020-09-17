![Creative Commons License](https://img.shields.io/badge/license-Creative%20Commons-success) ![In Development](https://img.shields.io/badge/status-Released-success) ![Code Coverage](https://img.shields.io/badge/code%20coverage-93%25-success)


<h1 align="center">DEMO CLEANUP</h1>
<p align="center">
This package contains a Lightning component and other support to help clean up demos between demo presentations, dry runs, and tests.
</p>

![Demo Cleanup](/images/Demo_Cleanup.png)

![Demo Cleanup Progress](/images/Demo_Cleanup_Progress.png)

## Summary

I often find myself in a situation where I need to dust off a demo long after I originally presented it and have forgotten if certain records are required for the demo, were generated during my testing, or were created during the last presentation. This makes getting the demo in a clean state for the next presentation more time-consuming and risky.

This component simply executes a number of demo cleanup tasks based either on criteria specified in a SOQL WHERE clause or through custom Apex actions.

## Installation and Setup

Read the disclaimer below and click on the **Install the Package** link. This will install all the components, objects, and other metadata to your org.

![Installation](/images/Install.png)

When installing, select the "Compile only the Apex in the package" option under the Advanced Options.

Assign the `Demo Cleanup` permission set to anyone who needs to use the component.

Once the package is deployed, you will need to create a Lightning app page with the Lightning App Builder and drag the `Demo Cleanup` custom component on the page where you would like to place it.

Right after you first install the package and place the component, you will have no demo cleanup tasks:

![No Demo Cleanup Tasks](/images/Demo_Cleanup_No_Tasks.png)

Click the "Take Me There" button to go to the `Demo Cleanup Tasks` tab, click the `New` button and choose which kind of cleanup task you wish to create:

- SOQL cleanup tasks use a SOQL WHERE clause to determine which records of an object to delete. Supply an object API name, a description, and an optional SOQL WHERE clause which specifies which records of that object should be deleted. For each task, you can also choose to permanently the records, or keep them in the recycle bin. Repeat for all of the objects whose records you would like to delete.
- Apex cleanup tasks allow the Apex developer to create arbitrary code to perform cleanup tasks that SOQL cannot handle by itselt. For these kinds of tasks, you need to enter the name of an Apex class that implements the `DemoCleanupApexItem` interface, and a description.

![Demo Cleanup Task](/images/Demo_Cleanup_Task.png)

## How to Deploy This Package to Your Org

I am a pre-sales Solutions Engineer for [Salesforce](https://www.salesforce.com) and I develop solutions for my customers to demonstrate the capabilities of the amazing Salesforce platform. *This package represents functionality that I have used for demonstration purposes  and the content herein is definitely not ready for actual production use; specifically, it has not been tested extensively nor has it been written with security and access controls in mind. By installing this package, you assume all risk for any consequences and agree not to hold me or my company liable.*  If you are OK with that ...

[Install the Package](https://login.salesforce.com/packaging/installPackage.apexp?p0=04t2E000003oc7HQAQ)

## Acknowledgements

I was inspired by work done by Salesforce super-SE John Schillaci to create this component.

## Maintainer

[John Meyer / johnsfdemo](https://github.com/johnsfdemo)
