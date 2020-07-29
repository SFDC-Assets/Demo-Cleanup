//  Batch date delete methods for the DemoCleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com


global without sharing class DemoCleanupBatch implements Database.Batchable<sObject>, Database.Stateful, Database.RaisesPlatformEvents {
    
    private String sObjectAPIName;
    private String sObjectLabel;
    private String whereClause;
    private Boolean permanentlyDelete;

    private Integer totalRecordsProcessed = 0;
    private Integer totalErrors = 0;
    
    
    //  Constructor method that gathers the information for the batch job and builds the query string.
    //  
    //  The parameters represent:
    //      objectAPIName:  the API name of the object whose records we will delete.
    //      whereCl:  the SOQL WHERE clause that identifies the records to be deleted.
    //      permanent:  True if the records are to bypass the recycle bin and be permanently deleted.
    
    global DemoCleanupBatch (String objectAPIName, String whereCl, Boolean permanent) {
        sObjectAPIName = objectAPIName;
        sObjectLabel = Schema.getGlobalDescribe().get(objectAPIName).getDescribe().getLabel();
        whereClause = whereCl;
        permanentlyDelete = permanent;
    }
    
    
    //  Start the query.
    
    global Database.QueryLocator start (Database.BatchableContext bc) {
        return Database.getQueryLocator('SELECT Id FROM ' + sObjectAPIName + (whereClause == null ? '' : ' WHERE ' + whereClause));
    }
    
    
    //  Delete records by the batch.
    
    global void execute (Database.BatchableContext bc, List<sObject> scope) {

        String errorJSON = '';

        for (Database.DeleteResult result : Database.delete(scope, false))
            if (!result.isSuccess()) {
                Id recordId = result.getId();
                for (Database.Error error : result.getErrors()) {
                    errorJSON += '{"id":"' + recordId + '","name":"' + sObjectLabel + '","link":"/lightning/r/' + sObjectAPIName + '/' + recordId + 
                        '/view","fields":"' + String.join(error.getFields(),',') + '","message":"' + error.getMessage().escapeEcmaScript() + '"},';
                    totalErrors++;
                }
            }
        if (permanentlyDelete)
            Database.emptyRecycleBin(scope);

        errorJSON = '[' + errorJSON.substringBeforeLast(',') + ']';   // Remove final ',' from error list
       
        totalRecordsProcessed += scope.size();
        
        EventBus.publish (new Demo_Cleanup_Event__e (
            Object_API_Name__c = sObjectAPIName,
            Total_Records_Deleted__c = totalRecordsProcessed,
            Total_Errors__c = totalErrors,
            Error_JSON_String__c = errorJSON
        ));
        
    }
    
    
    global void finish (Database.BatchableContext bc) {        
    }

}