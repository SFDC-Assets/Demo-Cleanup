//  Test class and metbods for the Demo Cleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

@isTest
private without sharing class DemoCleanupTest {

    private static final Integer NUMBER_OF_RECORDS = 10;

    @testSetup
    static void setup () {
 
        Map<String,Schema.RecordTypeInfo> rtInfo = Demo_Cleanup_Task__c.SObjectType.getDescribe().getRecordTypeInfosByName();
        Id soqlRecordTypeId = rtInfo.get('SOQL Cleanup Item').getRecordTypeId();
        Id apexRecordTypeId = rtInfo.get('Apex Cleanup Item').getRecordTypeId();

        List<DemoCleanup.CleanupTask> cleanupTasks = DemoCleanup.getCleanupTasks();
        System.assertEquals(0, cleanupTasks.size());

        List<Demo_Cleanup_Task__c> tasks = new List<Demo_Cleanup_Task__c> {
            new Demo_Cleanup_Task__c (
                RecordTypeId = soqlRecordTypeId,
                Object_API_Name__c = 'Account',
                Description__c = 'Delete all accounts where SIC code is "Test"',
                SOQL_Where_Clause__c = 'Sic = \'Test\'',
                Permanently_Delete__c = false,
                Active__c = true
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = soqlRecordTypeId,           
                Object_API_Name__c = 'Contact',
                Description__c = 'Delete all contacts, which should generate an error',
                Permanently_Delete__c = true,
                Active__c = true
            ), 
            new Demo_Cleanup_Task__c (
                RecordTypeId = soqlRecordTypeId,            
                Object_API_Name__c = 'Opportunity',
                Description__c = 'Delete all opportunities with a bad WHERE clause',
                SOQL_Where_Clause__c = 'john',
                Permanently_Delete__c = false,
                Active__c = true
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = apexRecordTypeId,
                Apex_Class_Name__c = 'DemoCleanupCustomApex',
                Description__c = 'Run custom Apex',
                Permanently_Delete__c = false,
                Active__c = true
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = apexRecordTypeId,
                Apex_Class_Name__c = 'BadApexClassName',
                Description__c = 'Run bad custom Apex class name',
                Permanently_Delete__c = false,
                Active__c = true
            ),
            new Demo_Cleanup_Task__c (
                RecordTypeId = apexRecordTypeId,
                Apex_Class_Name__c = 'DemoCleanupBadApexTest',
                Description__c = 'Run Apex class that throws an uncaught exception',
                Permanently_Delete__c = false,
                Active__c = true
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
    }


    @isTest
    private static void runTests () {

        Test.startTest();

        List<DemoCleanup.CleanupTask> cleanupTasks = DemoCleanup.getCleanupTasks();
        System.assertEquals(6, cleanupTasks.size());

        for (DemoCleanup.CleanupTask item : cleanupTasks)
            switch on item.itemRecordTypeName {
                when 'SOQL Cleanup Item' {
                    if (item.itemCount != 0)
                        DemoCleanup.cleanup (item.itemId, item.itemObjectApiName, item.itemNameField, item.itemWhereClause, item.itemPermanentlyDelete);
                }
                when 'Apex Cleanup Item' {
                    List<DemoCleanup.Toast> toasts = DemoCleanup.executeApex(item.itemId, item.itemApexClassName, item.itemPermanentlyDelete);
                }
            }

        // Cannot test for these since the work is done asynchronously ...
        // System.assertEquals(0, [SELECT count() FROM Account]);
        // System.assertEquals(0, [SELECT count() FROM Shipment]);

        Test.stopTest();
    }
}
