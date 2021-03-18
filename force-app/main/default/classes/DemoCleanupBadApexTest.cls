//  Apex class that throws an exception as part of the DemoCleanup Lightning component test suite.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

@isTest
public without sharing class DemoCleanupBadApexTest implements DemoCleanupApexItem {

    public class DemoCleanupException extends Exception {}

    public static Integer getRowCount () {
        return null;
    }
 
    public static void execute (Id taskId, Boolean permanentlyDelete) {
        if (taskId != null)
            throw new DemoCleanupException ('Throwing a DemoCleanupException');
    }
}