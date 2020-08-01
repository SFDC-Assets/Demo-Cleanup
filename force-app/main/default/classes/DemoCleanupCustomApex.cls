//  Class for executing arbitrary Apex cade as part of the DemoCleanup Lightning component.
//
//  This is distributed as an empty shell, with a simple Lightning toast message displayed. The shell illusttates how to display
//  a list of toasts similar to what I do in the main component.
//  
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com


public without sharing class DemoCleanupCustomApex {
    
    public class Toast {
        @AuraEnabled public String toastMessage;
        @AuraEnabled public String toastVariant;
        @AuraEnabled public String toastMode;
    }

    @AuraEnabled
    public static List<Toast> runCustomApex () {
        Toast toast = new Toast();
        List<Toast> toasts = new List<Toast>();
        
        //  Change anything you want in here.
        
        //  Just be sure to return a list of toasts to be displayed (can be null if needed).  The Toast class, defined in the
        //  DemoResetTools class, is a serialized JSON object that contains three Strings:
        //     toastMessage: the message you want to include in the toast.
        //     toastMode: the mode of the toast, i.e., "sticky", "dismissable", etc.
        //     toastVariant: the variant of the toast, i.e., "info", "error", "success".
        
        // toast.toastMessage = 'If you would like to run custom Apex, please modify DemoResetCustomApex.runCustomApex.';
        // toast.toastMode = 'sticky';
        // toast.toastVariant = 'info';
        // toasts.add(toast);
       
        return toasts;
    }
}