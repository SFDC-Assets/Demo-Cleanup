//  Test class and metbods for the Demo Cleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

@isTest(isParallel=true)
private without sharing class DemoCleanupTest {

    private static final Integer NUMBER_OF_RECORDS = 10;

    @testSetup
    static void setup () {
 
        final Map<String,Schema.RecordTypeInfo> rtInfo = Demo_Cleanup_Task__c.SObjectType.getDescribe().getRecordTypeInfosByName();
        final Id SOQL_RECORD_TYPE_ID = rtInfo.get('SOQL Cleanup Item').getRecordTypeId();
        final Id APEX_RECORD_TYPE_ID = rtInfo.get('Apex Cleanup Item').getRecordTypeId();
        final Id FLOW_RECORD_TYPE_ID = rtInfo.get('Flow Cleanup Item').getRecordTypeId();

        List<DemoCleanup.CleanupTask> cleanupTasks = DemoCleanup.getCleanupTasks(false);

        List<Demo_Cleanup_Task__c> tasks = new List<Demo_Cleanup_Task__c> {
            new Demo_Cleanup_Task__c (
                RecordTypeId = SOQL_RECORD_TYPE_ID,            
                Object_API_Name__c = 'Opportunity',
                Description__c = 'Delete all opportunities with a bad WHERE clause',
                SOQL_Where_Clause__c = 'john',
                Permanently_Delete__c = false,
                Active__c = true,
                Order__c = 0
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = APEX_RECORD_TYPE_ID,
                Apex_Class_Name__c = 'BadApexClassName',
                Description__c = 'Run bad custom Apex class name',
                Permanently_Delete__c = false,
                Active__c = true,
                Order__c = 1
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = APEX_RECORD_TYPE_ID,
                Apex_Class_Name__c = 'DemoCleanupBadApexTest',
                Description__c = 'Run Apex class that throws an uncaught exception',
                Permanently_Delete__c = false,
                Active__c = true,
                Order__c = 2
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = FLOW_RECORD_TYPE_ID,
                Flow_API_Name__c = 'Bad_Demo_Cleanup_Flow_Item_Test',
                Description__c = 'Try to run a non-existent test flow',
                Permanently_Delete__c = false,
                Active__c = true,
                Order__c = 3
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = APEX_RECORD_TYPE_ID,
                Apex_Class_Name__c = 'DemoCleanupCustomApex',
                Description__c = 'Run custom Apex',
                Permanently_Delete__c = false,
                Active__c = true,
                Order__c = 4
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = FLOW_RECORD_TYPE_ID,
                Flow_API_Name__c = 'Demo_Cleanup_Flow_Item_Test',
                Description__c = 'Run the test flow',
                Permanently_Delete__c = false,
                Active__c = true,
                Order__c = 5
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = SOQL_RECORD_TYPE_ID,           
                Object_API_Name__c = 'Contact',
                Description__c = 'Delete all contacts',
                Permanently_Delete__c = true,
                Active__c = true,
                Order__c = 6
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = SOQL_RECORD_TYPE_ID,
                Object_API_Name__c = 'Account',
                Description__c = 'Delete all accounts where SIC code is "Test"',
                SOQL_Where_Clause__c = 'Sic = \'Test\'',
                Permanently_Delete__c = false,
                Active__c = true,
                Order__c = 7
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = SOQL_RECORD_TYPE_ID,
                Object_API_Name__c = 'Account',
                Description__c = 'Duplicate Demo Cleanup Task for Account object',
                SOQL_Where_Clause__c = null,
                Permanently_Delete__c = false,
                Active__c = true,
                Order__c = 8               
            )
        };
        insert tasks;
    
        List<Account> accounts = new List<Account>();
        for (Integer i = 1; i <= NUMBER_OF_RECORDS; i++)
            accounts.add(new Account (
                Name = 'Account ' + i,
                Sic = 'Test'
            ));
        insert accounts;

        List<Contact> contacts = new List<Contact>();
        for (Integer i = 0; i < NUMBER_OF_RECORDS; i++)
            contacts.add(new Contact (
                FirstName = 'John',
                LastName = 'Meyer',
                AccountId = accounts[NUMBER_OF_RECORDS - i - 1].Id
            ));
        insert contacts;

        List<Case> cases = new List<Case>();
        for (Integer i = 0; i < NUMBER_OF_RECORDS; i++)
            cases.add(new Case (
                ContactId = contacts[i].Id,
                Subject = 'Case ' + i
            ));
        insert cases;
    }


    @isTest
    private static void testBadApexClassName () {
        System.Test.startTest();
        List<DemoCleanup.CleanupTask> cleanupTaskList = DemoCleanup.getCleanupTasks(false);
        DemoCleanup.startCleanup(JSON.serialize(new List<DemoCleanup.CleanupTask> { cleanupTaskList[1] }));
        System.Test.stopTest();
    }

    @isTest
    private static void testApexException () {
        System.Test.startTest();
        List<DemoCleanup.CleanupTask> cleanupTaskList = DemoCleanup.getCleanupTasks(false);
        DemoCleanup.startCleanup(JSON.serialize(new List<DemoCleanup.CleanupTask> { cleanupTaskList[2] }));
        System.Test.stopTest();
    }

    @isTest
    private static void testNonExistentFlow () {
        System.Test.startTest();
        List<DemoCleanup.CleanupTask> cleanupTaskList = DemoCleanup.getCleanupTasks(false);
        DemoCleanup.startCleanup(JSON.serialize(new List<DemoCleanup.CleanupTask> { cleanupTaskList[3] }));
        System.Test.stopTest();
    }

    @isTest
    private static void testApex () {
        System.Test.startTest();
        List<DemoCleanup.CleanupTask> cleanupTaskList = DemoCleanup.getCleanupTasks(false);
        DemoCleanup.startCleanup(JSON.serialize(new List<DemoCleanup.CleanupTask> { cleanupTaskList[4] }));
        System.Test.stopTest();
    }

    @isTest
    private static void testFlow () {
        System.Test.startTest();
        List<DemoCleanup.CleanupTask> cleanupTaskList = DemoCleanup.getCleanupTasks(false);
        DemoCleanup.startCleanup(JSON.serialize(new List<DemoCleanup.CleanupTask> { cleanupTaskList[5] }));
        System.Test.stopTest();
    }

    @isTest
    private static void testBadSOQLDeletion () {
        System.Test.startTest();
        List<DemoCleanup.CleanupTask> cleanupTaskList = DemoCleanup.getCleanupTasks(false);
        DemoCleanup.startCleanup(JSON.serialize(new List<DemoCleanup.CleanupTask> { cleanupTaskList[6] }));
        System.assertEquals(NUMBER_OF_RECORDS, [SELECT Id FROM Contact].size());
        System.Test.stopTest();
    }

    @isTest
    private static void testWhereClause () {
        System.Test.startTest();
        List<DemoCleanup.CleanupTask> cleanupTaskList = DemoCleanup.getCleanupTasks(false);
        DemoCleanup.startCleanup(JSON.serialize(new List<DemoCleanup.CleanupTask> { cleanupTaskList[7] }));
        System.assertEquals(NUMBER_OF_RECORDS, [SELECT Id FROM Account].size());
        System.Test.stopTest();
    }

    @isTest
    private static void testUpdateOrder () {
        System.Test.startTest();
        List<DemoCleanup.CleanupTask> cleanupTaskList = DemoCleanup.getCleanupTasks(false);
        Map<Id,Integer> orderMap = new Map<Id,Integer>();
        for (DemoCleanup.CleanupTask cleanupTask : cleanupTaskList)
            orderMap.put(cleanupTask.itemId, cleanupTask.itemOrder);
        DemoCleanup.saveOrderedTasks(JSON.serialize(orderMap));
        List<DemoCleanup.CleanupTask> newCleanupTaskList = DemoCleanup.getCleanupTasks(false);
        for (Integer i = 0; i < cleanupTaskList.size(); i++)
            System.assertEquals(newCleanupTaskList[i].itemOrder, cleanupTaskList[i].itemOrder);
        System.Test.stopTest();
    }

    @isTest
    private static void testGetPreviewRecords () {
        System.Test.startTest();
        System.assertEquals(NUMBER_OF_RECORDS - 3, DemoCleanup.getPreviewRecords('Contact', null, NUMBER_OF_RECORDS, 3).size());
        System.Test.stopTest();
    }

}
