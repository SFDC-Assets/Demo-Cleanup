//  Controller for the DemoCleanup Lightning component.
//  
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com


public without sharing class DemoCleanup {
    
    public class CleanupTask {
        @AuraEnabled public Id itemId;
        @AuraEnabled public String itemObjectApiName;
        @AuraEnabled public String itemLabelPlural;
        @AuraEnabled public String itemDescription;
        @AuraEnabled public String itemWhereClause;
        @AuraEnabled public Boolean itemPermanentlyDelete;
        @AuraEnabled public Integer itemCount;
        @AuraEnabled public Boolean itemQueryError;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static List<CleanupTask> getCleanupTasks () {
        
        List<Demo_Cleanup_Task__c> demoCleanupTasks = [
            SELECT  Object_API_Name__c, Description__c, SOQL_WHERE_Clause__c, Permanently_Delete__c
            FROM    Demo_Cleanup_Task__c
            WHERE   Active__c = true
            ORDER BY Name ASC
        ];
        
        if (demoCleanupTasks.IsEmpty())
            return null;
        else {
            List<CleanupTask> cleanupTasks = new List<CleanupTask>();
            for (Demo_Cleanup_Task__c cleanupItem : demoCleanupTasks) {
                CleanupTask cuTask = new CleanupTask();
                cuTask.itemId = cleanupItem.Id;
                cuTask.itemObjectApiName = cleanupItem.Object_API_Name__c;
                cuTask.itemWhereClause = cleanupItem.SOQL_WHERE_Clause__c;
                cuTask.itemLabelPlural = Schema.getGlobalDescribe().get(cleanupItem.Object_API_Name__c).getDescribe().getLabelPlural();
                cuTask.itemDescription = cleanupItem.Description__c;
                cuTask.itemPermanentlyDelete = cleanupItem.Permanently_Delete__c;
                try {
                    cuTask.itemCount = Database.countQuery('SELECT count() FROM ' + cleanupItem.Object_API_Name__c +
                        cleanupItem.SOQL_WHERE_Clause__c != null ? ' WHERE ' + cleanupItem.SOQL_WHERE_Clause__c : '');
                    cuTask.itemQueryError = false;
                } catch (QueryException e) {
                    cuTask.itemCount = 0;
                    cuTask.itemQueryError = true;
                }                
                cleanupTasks.add(cuTask);
            }
            return cleanupTasks;
        }        
    }    
    
    
    //  Resets the demo by deleting superfluous records created during previous demo runs.
    
    @AuraEnabled
    public static void cleanup (String objectApiName, String whereClause, Boolean permanentlyDelete) {
        Database.executeBatch(new DemoCleanupBatch(objectApiName, whereClause, permanentlyDelete));
    }
}