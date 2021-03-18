//  Interface describing the Apex cleanup task for the Demo Cleanup Lightning component.
//  
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

//  Refer to the DemoCleanupCustomApex class for more information and a template for creating your own
//  custom Apex classes that work with the DemoCleanup framework.

public interface DemoCleanupApexItem {

    // Executes the Apex cleanup task.
    //
    // The parameter represents:
    //    taskId: the ID of the demo cleanup task associated with this class.

    void execute (Id taskId);
}
