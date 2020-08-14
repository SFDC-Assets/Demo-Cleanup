//  Class for executing arbitrary Apex cade as part of the DemoCleanup Lightning component.
//
//  This is distributed as an empty shell, with a simple Lightning toast message displayed. The shell illusttates how to display
//  a list of toasts similar to what I do in the main component.
//  
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com


public without sharing class DemoCleanupCustomApex implements DemoCleanupApexItem {

    @AuraEnabled
    public static Integer getRowCount () {
        return 0;
    }
    
    @AuraEnabled
    public static List<DemoCleanup.Toast> execute (Boolean permanentlyDelete) {
        DemoCleanup.Toast toast = new DemoCleanup.Toast();
        List<DemoCleanup.Toast> toasts = new List<DemoCleanup.Toast>();
        
        //  Change anything you want in here.
        
        //  Just be sure to return a list of toasts to be displayed (can be null if needed).  The Toast class, defined in the
        //  DemoCleanup class, is a serialized JSON object that contains three Strings:
        //     toastMessage: the message you want to include in the toast.
        //     toastMode: the mode of the toast, i.e., "sticky", "dismissable", etc.
        //     toastVariant: the variant of the toast, i.e., "info", "error", "success".
        
        // toast.toastMessage = 'If you would like to run custom Apex, please modify DemoCleanupCustomApex.runCustomApex.';
        // toast.toastMode = 'sticky';
        // toast.toastVariant = 'info';
        // toasts.add(toast);
       
        return toasts;
    }
}