//  Controller for the Demo Cleanup Lightning component.
//  
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com


public without sharing class DemoCleanup {
    
    public class CleanupTask {
        @AuraEnabled public Id itemId;
        @AuraEnabled public Integer itemOrder;
        @AuraEnabled public String itemRecordTypeName;
        @AuraEnabled public String itemApexClassName;
        @AuraEnabled public String itemFlowApiName;
        @AuraEnabled public String itemObjectApiName;
        @AuraEnabled public String itemDescription;
        @AuraEnabled public String itemWhereClause;
        @AuraEnabled public Boolean itemPermanentlyDelete;
        @AuraEnabled public Integer itemCount;
        @AuraEnabled public Boolean itemQueryError;
    }

	//  Class used to collect error information to send back to the component in a platform event.

	public class ErrorSpec {
		public Id id;
		public String name;
		public String link;
		public String fields;
		public String message;
	}
    
 
    //  Get the list of demo cleanup tasks in the org.
    
    @AuraEnabled(cacheable=true)
    public static List<CleanupTask> getCleanupTasks () {
        
        List<Demo_Cleanup_Task__c> demoCleanupTasks = [
            SELECT   RecordType.Name, Order__c, Apex_Class_Name__c, Flow_API_Name__c, Object_API_Name__c, Description__c, SOQL_WHERE_Clause__c, Permanently_Delete__c
            FROM     Demo_Cleanup_Task__c
            WHERE    Active__c = true
            ORDER BY Order__c ASC NULLS LAST
        ];

        List<CleanupTask> cleanupTasks = new List<CleanupTask>();
        for (Demo_Cleanup_Task__c demoCleanupTask : demoCleanupTasks) {
            CleanupTask task = new CleanupTask();
            task.itemId = demoCleanupTask.Id;
            task.itemOrder = Integer.valueOf(demoCleanupTask.Order__c);
            task.itemRecordTypeName = demoCleanupTask.RecordType.Name;
            task.itemDescription = demoCleanupTask.Description__c;
            task.itemPermanentlyDelete = demoCleanupTask.Permanently_Delete__c;
            switch on demoCleanupTask.RecordType.Name {
                when 'Apex Cleanup Item' {
                    task.itemApexClassName = demoCleanupTask.Apex_Class_Name__c;
                    task.itemCount = null;
                    try {
                        DemoCleanupApexItem test = (DemoCleanupApexItem) Type.forName(task.itemApexClassName).newInstance();
                        task.itemQueryError = false;
                    } catch (Exception e) {
                        task.itemQueryError = true;
                    }
                }
                when 'SOQL Cleanup Item' {
                    task.itemObjectApiName = demoCleanupTask.Object_API_Name__c;
                    task.itemWhereClause = demoCleanupTask.SOQL_WHERE_Clause__c;
                    try {
                        task.itemCount = Database.countQuery('SELECT count() FROM ' + demoCleanupTask.Object_API_Name__c +
                            (demoCleanupTask.SOQL_WHERE_Clause__c == null ? '' : ' WHERE ' + demoCleanupTask.SOQL_WHERE_Clause__c));
                        task.itemQueryError = false;
                    } catch (QueryException e) {
                        task.itemCount = null;
                        task.itemQueryError = true;
                    }
                }
                when 'Flow Cleanup Item' {
                    task.itemFlowApiName = demoCleanupTask.Flow_API_Name__c;
                    task.itemCount = null;
                    try {
                        Flow.Interview.createInterview(task.itemFlowApiName, new Map<String,Id> { 'DemoCleanupTaskId' => task.itemId });
                        task.itemQueryError = false;
                    } catch (Exception e) {
                        task.itemQueryError = true;
                    }
                }
            }            
            cleanupTasks.add(task);
        }
        
        return cleanupTasks;
    }

    
    //  Saves the re-ordered demo cleanup tasks in the database.  We need to pass in the map of Demo Cleanup Task
    //  ids to order since the Apex middleware cannot deserialize a Map<Id,Integer> automatically, so we do it
    //  explicitly.
    //
    //  The parameter represents:
    //      orderedMapJSON:  a JSON string containing a map of the form "id":"order" which specifies which order the
    //          given Demo Cleanup Task should be executed.

    @AuraEnabled
    public static void saveOrderedTasks (String orderedMapJSON) {
        Map<Id,Integer> orderedMap = (Map<Id,Integer>) JSON.deserialize(orderedMapJSON, Map<Id,Integer>.class);
        List<Demo_Cleanup_Task__c> demoCleanupTasks = [SELECT Order__c FROM Demo_Cleanup_Task__c WHERE Active__c = true];
        for (Demo_Cleanup_Task__c demoCleanupTask : demoCleanupTasks)
            demoCleanupTask.Order__c = orderedMap.get(demoCleanupTask.Id);
        update demoCleanupTasks;
    }


    //  Kick off the cleanup process.  We need to pass in the list of CleanupTasks as a JSON string because the
    //  Apex middleware has a hard time deserializing a List<CleanupTask> automatically, so we do it explicitly.
    //
    //  The parameter represents:
    //      cleanupTaskListJSON:  a JSON string containing the list of ordered CleanupTasks from the component.

    @AuraEnabled
    public static void startCleanup (String cleanupTaskListJSON) {
        cleanup ((List<CleanupTask>) JSON.deserialize(cleanupTaskListJSON, List<CleanupTask>.class), 0);
    }


    //  Kick off the cleanup task specified at the currentItem-th position in the ordered CleanupTask list.
    //  This method is invoked by all of the classes that handle the asynchronous execution of the tasks.
    //
    //  The parameters represent:
    //      cleanupTaskList:  the ordered list of cleanup tasks in this run.
    //      currentItem:  the zero-based index of the current item in the ordered cleanup task list.

    public static void cleanup (List<CleanupTask> cleanupTaskList, Integer currentItem) {

        if (currentItem < cleanupTaskList.size())
            switch on cleanupTaskList[currentItem].itemRecordTypeName {
                when 'SOQL Cleanup Item' {
                    Database.executeBatch(new DemoCleanupBatch(cleanupTaskList, currentItem));
                }
                when 'Apex Cleanup Item' {
                    if (System.Limits.getQueueableJobs() < System.Limits.getLimitQueueableJobs())
                        System.enqueueJob(new DemoCleanupApex(cleanupTaskList, currentItem));
                }
                when 'Flow Cleanup Item' {
                    if (System.Limits.getQueueableJobs() < System.Limits.getLimitQueueableJobs())
                        System.enqueueJob(new DemoCleanupFlow(cleanupTaskList, currentItem));
                }
            }
    }

}