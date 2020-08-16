//  Template class for executing arbitrary Apex cade as part of the DemoCleanup Lightning component.
//
//  This is distributed as an empty shell, with a simple Lightning toast message displayed. The shell illustrates how to display
//  a list of toasts for informational purposes.
//
//  If you wish to use this template, make a copy of it as any changes to this file will be overwritten in a package update.
//  
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com


public without sharing class DemoCleanupCustomApex implements DemoCleanupApexItem {

    // Returns the number of rows that will be deleted by this cleanup task.  Can be null if no rows are deleted.
    // This could also be interpreted as the number of subtasks to be completed in a generic Apex run.

    @AuraEnabled
    public static Integer getRowCount () {
        return null;
    }
 

    // Returns a list of messages describing the execution of the cleanup task.
    //
    // The parameters represent:
    //    taskId: the ID of the demo cleanup task associated with this class.
    //    permanentlyDelete: true if the records should bypass the recycle bin, false otherwise.

    @AuraEnabled
    public static List<DemoCleanup.Toast> execute (Id taskId, Boolean permanentlyDelete) {

        List<DemoCleanup.Toast> toasts = new List<DemoCleanup.Toast>();
        
        //  Change anything you want in here.  Just be careful of Salesforce governor limits.

        //  You can optionally publish events showing the progress of any record deletions by keeping track of the total
        //  number of records deleted so far and the number of errors encountered so far.  Put the following code at
        //  various completion points, for example:
        //
        //  EventBus.publish (new Demo_Cleanup_Event__e (
        //      Task_Id__c = taskId,
        //      Finished__c = false,
        //      Total_Records_Deleted__c = 0,
        //      Total_Errors__c = 0
        //  ));
        //
        //  The component will close out the execution display so there is no need to publish an event with Finished__c = true
        //  when complete.
        //
        //  Just be sure to return a list of toasts to be displayed (can be null or empty if needed).  The Toast class, defined
        //  in the DemoCleanup class, is a serialized JSON object that contains three Strings:
        //     toastMessage: the message you want to include in the toast.
        //     toastMode: the mode of the toast, i.e., "sticky", "dismissable", etc.
        //     toastVariant: the variant of the toast, i.e., "info", "error", "success".
        
        DemoCleanup.Toast toast = new DemoCleanup.Toast();
        toast.toastMessage = 'If you would like to run custom Apex, please modify DemoCleanupCustomApex.execute.';
        toast.toastMode = 'sticky';
        toast.toastVariant = 'info';
        toasts.add(toast);
       
        return toasts;
    }
}