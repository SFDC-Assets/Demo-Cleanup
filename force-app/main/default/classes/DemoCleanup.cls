//  Controller for the Demo Cleanup Lightning component.
//
//  Copyright (c) 2021-2023, salesforce.com, inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

@SuppressWarnings('PMD.CognitiveComplexity, PMD.ExcessivePublicCount, PMD.IfStmtsMustUseBraces, PMD.IfElseStmtsMustUseBraces, PMD.ForLoopsMustUseBraces')
public without sharing class DemoCleanup {

    public final static String SOQL_RECORD_TYPE_NAME = 'SOQL Cleanup Task';
    public final static String APEX_RECORD_TYPE_NAME = 'Apex Cleanup Task';
    public final static String FLOW_RECORD_TYPE_NAME = 'Flow Cleanup Task';
    
    public class CleanupTask {
        @AuraEnabled public Id itemId;
        @AuraEnabled public Integer itemOrder;
        @AuraEnabled public String itemRecordTypeName;
        @AuraEnabled public String itemApexClassName;
        @AuraEnabled public String itemFlowApiName;
        @AuraEnabled public String itemObjectApiName;
        @AuraEnabled public String itemDuplicateObjectTask;
        @AuraEnabled public String itemDescription;
        @AuraEnabled public String itemWhereClause;
        @AuraEnabled public Boolean itemPermanentlyDelete;
        @AuraEnabled public Integer itemCount;
        @AuraEnabled public Boolean itemQueryError;
    }

    public class PreviewItem {
        @AuraEnabled public Id itemId;
        @AuraEnabled public String itemName;
        @AuraEnabled public Id itemOwnerId;
        @AuraEnabled public String itemOwnerName;
        @AuraEnabled public DateTime itemCreatedDate;
        @AuraEnabled public DateTime itemModifiedDate;
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
    //
    //  The parameters represent:
    //      allowReusedObjects: set to true if multiple SOQL cleanup tasks for the same object are allowed

    @SuppressWarnings('PMD.ApexCRUDViolation')
    @AuraEnabled
    public static List<CleanupTask> getCleanupTasks (Boolean allowReusedObjects) {
        
        List<Demo_Cleanup_Task__c> demoCleanupTasks = [
            SELECT   RecordType.Name, Order__c, Apex_Class_Name__c, Flow_API_Name__c, Object_API_Name__c, Description__c,
                     SOQL_WHERE_Clause__c, Permanently_Delete__c
            FROM     Demo_Cleanup_Task__c
            WHERE    Active__c = true
            WITH     SYSTEM_MODE
            ORDER BY Order__c ASC NULLS LAST
        ];

        Map<String,String> objectsSeen = new Map<String,String>();
        List<CleanupTask> cleanupTasks = new List<CleanupTask>();

        for (Demo_Cleanup_Task__c demoCleanupTask : demoCleanupTasks) {
            CleanupTask task = new CleanupTask();
            task.itemId = demoCleanupTask.Id;
            task.itemOrder = Integer.valueOf(demoCleanupTask.Order__c);
            task.itemRecordTypeName = demoCleanupTask.RecordType.Name;
            task.itemDescription = demoCleanupTask.Description__c;
            task.itemPermanentlyDelete = demoCleanupTask.Permanently_Delete__c;
            switch on demoCleanupTask.RecordType.Name {
                when 'SOQL Cleanup Task' {
                    task.itemObjectApiName = demoCleanupTask.Object_API_Name__c;
                    task.itemWhereClause = demoCleanupTask.SOQL_WHERE_Clause__c;
                    if (!allowReusedObjects && objectsSeen.containsKey(demoCleanupTask.Object_API_Name__c)) {
                        task.itemCount = null;
                        task.itemQueryError = true;
                        task.itemDuplicateObjectTask = objectsSeen.get(demoCleanupTask.Object_API_Name__c);
                    } else
                        try {
                            task.itemCount = Database.countQuery(
                                'SELECT count()' +
                                ' FROM ' + demoCleanupTask.Object_API_Name__c +
                                (String.isBlank(demoCleanupTask.SOQL_WHERE_Clause__c) ? '' :
                                    ' WHERE (' + demoCleanupTask.SOQL_WHERE_Clause__c + ')') +
                                ' WITH SYSTEM_MODE'
                            );
                            task.itemQueryError = false;
                            objectsSeen.put(demoCleanupTask.Object_API_Name__c, demoCleanupTask.Description__c);
                        } catch (QueryException e) {
                            task.itemCount = null;
                            task.itemQueryError = true;
                        }
                }
                when 'Apex Cleanup Task' {
                    task.itemApexClassName = demoCleanupTask.Apex_Class_Name__c;
                    task.itemCount = null;
                    task.itemQueryError = !validateApexClass(task.itemApexClassName);
                }
                when 'Flow Cleanup Task' {
                    task.itemFlowApiName = demoCleanupTask.Flow_API_Name__c;
                    task.itemCount = null;
                    task.itemQueryError = !validateFlow(task.itemFlowApiName, task.itemId);
                }
            }            
            cleanupTasks.add(task);
        }
        
        return cleanupTasks;
    }


    //  Validates a SOQL Demo Cleanup Task.
    //
    //  The parameters represent:
    //      allowReusedObjects: set to true if multiple SOQL cleanup tasks for the same object are allowed
    //      objectApiName:  the API name of the object to check.
    //      whereClause:  an optional WHERE clause exxpression to filter the records.


    @SuppressWarnings('PMD.ApexCRUDViolation, PMD.ApexSOQLInjection')
    @AuraEnabled
    public static String validateSoql (Boolean allowReusedObjects, String objectApiName, String whereClause) {

        String returnValue;
        String query = 'SELECT Id FROM ' + objectApiName + (String.isBlank(whereClause) ? '' : ' WHERE ' + whereClause) + ' WITH SYSTEM_MODE';

        try {
            Database.query(query);
        } catch (QueryException e) {
            return 'The test query [' + query + '] generated an error. Please check the object and WHERE clause expression.';
        }

        if (!allowReusedObjects) {
            List<Demo_Cleanup_Task__c> soqlCleanupTasks = [
                SELECT Object_API_Name__c, Description__c
                FROM   Demo_Cleanup_Task__c
                WHERE  Active__c = true AND RecordType.Name = :SOQL_RECORD_TYPE_NAME
                WITH   SYSTEM_MODE
            ];
            Map<String,Demo_Cleanup_Task__c> taskMap = new Map<String,Demo_Cleanup_Task__c>();
            for (Demo_Cleanup_Task__c task : soqlCleanupTasks)
                taskMap.put(task.Object_API_Name__c, task);
            if (taskMap.containsKey(objectApiName))
                return 'Your object (' + objectApiName + ') is already used in task \'' + taskMap.get(objectApiName).Description__c + '\'.';
        }

        return null;
    }


    //  Validates an Apex Demo Cleanup Task.
    //
    //  The parameters represent:
    //      apexClassName: the name of the Apex class.

    @AuraEnabled
    public static Boolean validateApexClass (String apexClassName) {
        try {
            Type.forName(apexClassName).newInstance();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    
    //  Validates a Flow Demo Cleanup Task.
    //
    //  The parameters represent:
    //      flowApiName:  the name of the Apex class.
    //      taskId:  the Id of the Demo Cleanup Task to verify

    @AuraEnabled
    public static Boolean validateFlow (String flowApiName, Id taskId) {
        try {
            Flow.Interview.createInterview(flowApiName, new Map<String,Id> { 'DemoCleanupTaskId' => taskId });
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    
    //  Saves the re-ordered demo cleanup tasks in the database.  We need to pass in the map of Demo Cleanup Task
    //  ids to order since the Apex middleware cannot deserialize a Map<Id,Integer> automatically, so we do it
    //  explicitly.
    //
    //  The parameter represents:
    //      orderedMapJSON:  a JSON string containing a map of the form "id":"order" which specifies which order the
    //          given Demo Cleanup Task should be executed.

    @SuppressWarnings('PMD.ApexCRUDViolation')
    @AuraEnabled
    public static void saveOrderedTasks (String orderedMapJSON) {
        Map<Id,Integer> orderedMap = (Map<Id,Integer>) JSON.deserialize(orderedMapJSON, Map<Id,Integer>.class);
        List<Demo_Cleanup_Task__c> demoCleanupTasks = [
            SELECT  Order__c
            FROM    Demo_Cleanup_Task__c
            WHERE   Active__c = true
            WITH    SYSTEM_MODE
            FOR     UPDATE
        ];
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
                when 'SOQL Cleanup Task' {
                    Database.executeBatch(new DemoCleanupBatch(cleanupTaskList, currentItem));
                }
                when 'Apex Cleanup Task' {
                    if (System.Limits.getQueueableJobs() < System.Limits.getLimitQueueableJobs())
                        System.enqueueJob(new DemoCleanupApex(cleanupTaskList, currentItem));
                }
                when 'Flow Cleanup Task' {
                    if (System.Limits.getQueueableJobs() < System.Limits.getLimitQueueableJobs())
                        System.enqueueJob(new DemoCleanupFlow(cleanupTaskList, currentItem));
                }
            }
    }


    //  Find the name field for an object.
    //
    //  The parameter represents:
    //      objectApiName:  the API name of the object whose name field is wanted.

    public static String getNameField (String objectApiName) {
		String name;
        for (Schema.SObjectField field : Schema.describeSObjects(new List<String> {objectApiName})[0].fields.getMap().values())
            if (field.getDescribe().isNameField()) {
                name = field.getDescribe().getName();
                break;
            }
        return name;
    }


    //  Retrieve a number of records of the given object type beginning at a specific offset.
    //
    //  The parameters represent:
    //      objectApiName:  the API name of the object whose records are to be previewed.
    //      whereClause:  an optional WHERE clause expression to filter the records.
    //      numberOfRecords:  the number of records to retrieve.
    //      offset:  the number of records to skip before retrieving.

    @SuppressWarnings('PMD.ExcessiveParameterList, PMD.ApexSoqlInjection, PMD.ApexCRUDViolation')
    @AuraEnabled(cacheable=true)
    public static List<PreviewItem> getPreviewRecords (String objectApiName, String whereClause, Integer numberOfRecords, Integer offset) {

        String nameField = getNameField(objectApiName);
        Boolean hasOwnerId = Schema.describeSObjects(new List<String> {objectApiName})[0].fields.getMap().containsKey('ownerid');
        List<SObject> records = Database.query(
            'SELECT CreatedDate, LastModifiedDate, ' + nameField + (hasOwnerId ? ', OwnerId, Owner.Name' : '') +
            ' FROM ' + objectApiName + 
            (String.isBlank(whereClause) ? '' : ' WHERE (' + whereClause + ')') +
            ' WITH SYSTEM_MODE ' +
            ' LIMIT ' + numberOfRecords + 
            ' OFFSET ' + offset
        );
        List<PreviewItem> previewItems = new List<PreviewItem>();

        for (SObject record : records) {
            PreviewItem item = new PreviewItem();
            item.itemId = (Id) record.get('Id');
            item.itemName = String.valueOf(record.get(nameField));
            item.itemOwnerId = hasOwnerId ? (Id) record.get('OwnerId') : null;
            item.itemOwnerName = hasOwnerId ? String.valueOf(record.getSObject('Owner').get('Name')) : null;
            item.itemCreatedDate = (DateTime) record.get('CreatedDate');
            item.itemModifiedDate = (DateTime) record.get('LastModifiedDate');
            previewItems.add(item);
        }

        return previewItems;
    }

 
    //  Class used to return combobox selections.

    public class Selector {
        @AuraEnabled public String label;
        @AuraEnabled public string value;

        private Selector (String label, String value) {
            this.label = label;
            this.value = value;
        }
    }
     

    //  Get the list of objects in the org.

    @AuraEnabled(cacheable=true)
    public static List<Selector> getOrgObjectList () {
        List<Selector> objectList = new List<Selector>();
        for (Schema.SObjectType sot : Schema.getGlobalDescribe().values()) {
            Schema.DescribeSObjectResult dsor = sot.getDescribe();
            if (dsor.isQueryable() && dsor.isDeletable()) {
                String objectApiName = dsor.getName();
                String label = dsor.getLabel();
                if (!label.contains('__MISSING LABEL__') && objectApiName != 'Demo_Cleanup_Task__c' && objectApiName != 'Demo_Cleanup_Event__e')
                    objectList.add(new Selector(label, objectApiName));
            }
        }
        return objectList;
    }


    //  Generate list of Apex classes that implement the DemoCleanupApexItem interface.

    @SuppressWarnings('PMD.ApexCRUDViolation')
    @AuraEnabled(cacheable=true)
    public static List<Selector> getApexClassList () {
        List<Selector> apexList = new List<Selector>();
        for (ApexTypeImplementor ati : [SELECT ClassName FROM ApexTypeImplementor WHERE InterfaceName = 'DemoCleanupApexItem' AND ApexClass.IsValid = true AND IsConcrete = true])
            apexList.add(new Selector(ati.ClassName, ati.ClassName));
        return apexList;
    }

}