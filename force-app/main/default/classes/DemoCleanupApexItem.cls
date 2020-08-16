//  Interface describing the Apex cleanup task for the Demo Cleanup Lightning component.
//  
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

//  Refer to the DemoCleanupCustomApex class for more information and a template for creating your own
//  custom Apex classes that work with the DemoCleanup framework.

public interface DemoCleanupApexItem {

    // Returns the number of rows that will be deleted by this cleanup task.  Can be null if no rows are deleted.
    // This could also be interpreted as the number of subtasks to be completed in a generic Apex run.

    Integer getRowCount ();


    // Returns a list of messages describing the execution of the cleanup task.
    //
    // The parameters represent:
    //    taskId: the ID of the demo cleanup task associated with this class.
    //    permanentlyDelete: true if the records should bypass the recycle bin, false otherwise.

    List<DemoCleanup.Toast> execute (Id taskId, Boolean permanentlyDelete);
}
