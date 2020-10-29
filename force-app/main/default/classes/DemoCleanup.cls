//  Controller for the Demo Cleanup Lightning component.
//  
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com


public without sharing class DemoCleanup {
    
    public class CleanupTask {
        @AuraEnabled public Id itemId;
        @AuraEnabled public String itemRecordTypeName;
        @AuraEnabled public String itemApexClassName;
        @AuraEnabled public String itemFlowApiName;
        @AuraEnabled public String itemObjectApiName;
        @AuraEnabled public String itemNameField;
        @AuraEnabled public String itemDescription;
        @AuraEnabled public String itemWhereClause;
        @AuraEnabled public Boolean itemPermanentlyDelete;
        @AuraEnabled public Integer itemCount;
        @AuraEnabled public Boolean itemQueryError;
    }

    public class Toast {
        @AuraEnabled public String toastTitle;
        @AuraEnabled public String toastMessage;
        @AuraEnabled public String toastVariant;
        @AuraEnabled public String toastMode;
    }
    
 
    //  Get the list of demo cleanup tasks in the org.
    
    @AuraEnabled(cacheable=true)
    public static List<CleanupTask> getCleanupTasks () {
        
        List<Demo_Cleanup_Task__c> demoCleanupTasks = [
            SELECT  RecordType.Name, Apex_Class_Name__c, Flow_API_Name__c, Object_API_Name__c, Description__c, SOQL_WHERE_Clause__c, Permanently_Delete__c
            FROM    Demo_Cleanup_Task__c
            WHERE   Active__c = true
            ORDER BY Name ASC
        ];

        List<CleanupTask> cleanupTasks = new List<CleanupTask>();
        for (Demo_Cleanup_Task__c cleanupItem : demoCleanupTasks) {
            CleanupTask cuTask = new CleanupTask();
            cuTask.itemId = cleanupItem.Id;
            cuTask.itemRecordTypeName = cleanupItem.RecordType.Name;
            cuTask.itemDescription = cleanupItem.Description__c;
            cuTask.itemPermanentlyDelete = cleanupItem.Permanently_Delete__c;
            switch on cleanupItem.RecordType.Name {
                when 'Apex Cleanup Item' {
                    try {
                        cuTask.itemApexClassName = cleanupItem.Apex_Class_Name__c;
                        cuTask.itemCount = ((DemoCleanupApexItem) Type.forName(cleanupItem.Apex_Class_Name__c).newInstance()).getRowCount();
                        cuTask.itemQueryError = false;
                    } catch (Exception e) {
                        cuTask.itemCount = 0;
                        cuTask.itemQueryError = true;
                    }
                }
                when 'SOQL Cleanup Item' {
                    cuTask.itemObjectApiName = cleanupItem.Object_API_Name__c;
                    cuTask.itemNameField = getNameField(cleanupItem.Object_API_Name__c);
                    cuTask.itemWhereClause = cleanupItem.SOQL_WHERE_Clause__c;
                    try {
                        cuTask.itemCount = Database.countQuery('SELECT count() FROM ' + cleanupItem.Object_API_Name__c +
                            (cleanupItem.SOQL_WHERE_Clause__c == null ? '' : ' WHERE ' + cleanupItem.SOQL_WHERE_Clause__c));
                        cuTask.itemQueryError = false;
                    } catch (QueryException e) {
                        cuTask.itemCount = 0;
                        cuTask.itemQueryError = true;
                    }
                }
                when 'Flow Cleanup Item' {
                    cuTask.itemFlowApiName = cleanupItem.Flow_API_Name__c;
                    cuTask.itemCount = 0;
                    cuTask.itemQueryError = false;
                }
            }            
            cleanupTasks.add(cuTask);
        }
        
        return cleanupTasks;
    }


    //  Find the name field for an object.

    private static String getNameField (String objectApiName) {
        String name = '';
        for (Schema.SObjectField field : Schema.getGlobalDescribe().get(objectApiName).getDescribe().fields.getMap().values())
            if (field.getDescribe().isNameField()) {
                name = field.getDescribe().getName();
                break;
            }
        return name;
    }
    
    
    //  Executes a single SOQL demo cleanup task.
    
    @AuraEnabled
    public static void cleanup (Id taskId, String objectApiName, String nameField, String whereClause, Boolean permanentlyDelete) {
        Database.executeBatch(new DemoCleanupBatch(taskId, objectApiName, nameField, whereClause, permanentlyDelete));
    }


    //  Executes a single Apex demo cleanup task.

    @AuraEnabled
    public static List<Toast> executeApex (Id taskId, String description, String apexClassName, Boolean permanentlyDelete) {

        Boolean error;
        List<Toast> toasts = new List<Toast>();
        
        try {
            toasts = ((DemoCleanupApexItem) Type.forName(apexClassName).newInstance()).execute(taskId, permanentlyDelete);
            error = false;
        } catch (Exception e) {
            Toast errorToast = new Toast();
            errorToast.toastTitle = 'There was an uncaught exception in Apex cleanup item "' + description + '"';
            errorToast.toastMessage = e.getMessage();
            errorToast.toastMode = 'sticky';
            errorToast.toastVariant = 'error';
            toasts.add(errorToast);
            error = true;
        }

        EventBus.publish (new Demo_Cleanup_Event__e (
            Task_Id__c = taskId,
            Finished__c = true,
            Total_Records_Deleted__c = 0,
            Total_Errors__c = error ? 1 : 0
        ));
        
        return toasts;
    }


    //  Runs an autolaunched flow.

    @AuraEnabled
    public static List<Toast> runFlow (Id taskId, String description, String flowApiName) {

        Boolean error;
        List<Toast> returnValue;

        try {
            Flow.Interview.createInterview(flowApiName, new Map<String,Object> { 'DemoCleanupTaskId' => taskId }).start();
            returnValue = null;
            error = false;
        } catch (Exception e) {
            Toast errorToast = new Toast();
            errorToast.toastTitle = 'Could not execute flow cleanup item "' + description + '"';
            errorToast.toastMessage = e.getMessage();
            errorToast.toastMode = 'sticky';
            errorToast.toastVariant = 'error';
            returnValue = new List<Toast> {errorToast};
            error = true;
        }

        EventBus.publish (new Demo_Cleanup_Event__e (
            Task_Id__c = taskId,
            Finished__c = true,
            Total_Records_Deleted__c = 0,
            Total_Errors__c = error ? 1 : 0
        ));

        return returnValue;
    }
}