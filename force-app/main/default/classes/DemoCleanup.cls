//  Controller for the DemoCleanup Lightning component.
//  
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com


public without sharing class DemoCleanup {
    
    public class CleanupTask {
        @AuraEnabled public Id itemId;
        @AuraEnabled public String itemDescription;
        @AuraEnabled public Boolean itemPermanentlyDelete;
        @AuraEnabled public String itemLink;
        @AuraEnabled public Integer itemCount;
        @AuraEnabled public Boolean itemQueryError;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static List<CleanupTask> getCleanupTasks () {
        
        List<Demo_Cleanup_Task__c> demoCleanupTasks = [
            SELECT Object_API_Name__c, Description__c, SOQL_WHERE_Clause__c, Permanently_Delete__c
            FROM   Demo_Cleanup_Task__c
            WHERE  Active__c = true
            ORDER BY Name ASC
        ];
        
        if (demoCleanupTasks.IsEmpty())
            return null;
        else {
            List<CleanupTask> cleanupTasks = new List<CleanupTask>();
            for (Demo_Cleanup_Task__c cleanupItem : demoCleanupTasks) {
                CleanupTask item = new CleanupTask();
                item.itemId = cleanupItem.Id;
                item.itemLink = '/lightning/r/Demo_Cleanup_Task__c/' + cleanupItem.Id + '/view';
                item.itemDescription = cleanupItem.Description__c;
                item.itemPermanentlyDelete = cleanupItem.Permanently_Delete__c;
                try {
                    item.itemCount = Database.countQuery('SELECT count() FROM ' + cleanupItem.Object_API_Name__c +
                        cleanupItem.SOQL_WHERE_Clause__c != null ? ' WHERE ' + cleanupItem.SOQL_WHERE_Clause__c : '');
                    item.itemQueryError = false;
                } catch (QueryException e) {
                    item.itemCount = 0;
                    item.itemQueryError = true;
                }                
                cleanupTasks.add(item);
            }
            return cleanupTasks;
        }        
    }    
    
    
    //  Resets the demo by deleting superfluous records created during previous demo runs.
    
    @AuraEnabled
    public static void demoCleanup (List<Id> taskItems) {
        List<Demo_Cleanup_Task__c> cleanupTasks = [
            SELECT Object_API_Name__c, SOQL_WHERE_Clause__c, Permanently_Delete__c
            FROM   Demo_Cleanup_Task__c
            WHERE  Id IN :taskItems AND Active__c = true
            ORDER BY Name ASC
        ];
        for (Demo_Cleanup_Task__c item : cleanupTasks)
            Database.executeBatch(new DemoCleanupBatch(item.Object_API_Name__c, item.SOQL_WHERE_Clause__c, item.Permanently_Delete__c));
    }
}