//  Interface describing the Apex cleanup task for the Demo Cleanup Lightning component.
//  
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com


public interface DemoCleanupApexItem {

    // Returns the number of rows that will be deleted by this cleanup task.

    Integer getRowCount ();


    // Returns a list of messages describing the execution of the cleanup task.
    //
    // The parameters represent:
    //        permanentlyDelete     True if the records should bypass the recycle bin, false otherwise.

    List<DemoCleanup.Toast> execute (Boolean permanentlyDelete);
}
