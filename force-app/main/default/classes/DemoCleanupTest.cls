//  Test class and metbods for the Demo Cleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

@isTest
private without sharing class DemoCleanupTest {

    private static final Integer NUMBER_OF_RECORDS = 10;

    @testSetup
    static void setup () {
        List<DemoCleanup.CleanupTask> cleanupTasks = DemoCleanup.getCleanupTasks();
        System.assertEquals(0, cleanupTasks.size());

        List<Demo_Cleanup_Task__c> tasks = new List<Demo_Cleanup_Task__c> {
            new Demo_Cleanup_Task__c (
                Object_API_Name__c = 'Shipment',
                Description__c = 'Delete all shipments',
                Permanently_Delete__c = true,
                Active__c = true
            ),   
            new Demo_Cleanup_Task__c (
                Object_API_Name__c = 'Account',
                Description__c = 'Delete all accounts where SIC code is "Test"',
                SOQL_Where_Clause__c = 'Sic = \'Test\'',
                Permanently_Delete__c = false,
                Active__c = true
            ),
            new Demo_Cleanup_Task__c (
                Object_API_Name__c = 'Contact',
                Description__c = 'Delete all contacts, which should generate an error',
                Permanently_Delete__c = true,
                Active__c = true
            ), 
            new Demo_Cleanup_Task__c (
                Object_API_Name__c = 'Opportunity',
                Description__c = 'Delete all opportunities with a bad WHERE clause',
                SOQL_Where_Clause__c = 'john',
                Permanently_Delete__c = false,
                Active__c = true
            )
        };
        insert tasks;
    
        List<Account> accounts = new List<Account>();
        for (Integer i = 1; i <= NUMBER_OF_RECORDS; i++)
            accounts.add(new Account (
                Name = 'Account' + i,
                Sic = 'Test'
            ));
        insert accounts;

        List<Contact> contacts = new List<Contact>();
        for (Integer i = 0; i < NUMBER_OF_RECORDS; i++)
            contacts.add(new Contact (
                FirstName = 'John',
                LastName = 'Meyer',
                AccountId = accounts[i].Id
            ));
        insert contacts;
        
        List<Shipment> shipments = new List<Shipment>();
        DateTime now = DateTime.now();
        for (Integer i = 0; i < NUMBER_OF_RECORDS; i++)
            shipments.add(new Shipment (
                ShipToName = 'Test Name',
                ActualDeliveryDate = now.addDays(i)
            ));
        insert shipments;
    }


    @isTest
    private static void runTests () {

        Test.startTest();

        List<DemoCleanup.CleanupTask> cleanupTasks = DemoCleanup.getCleanupTasks();
        System.assertEquals(4, cleanupTasks.size());

        for (DemoCleanup.CleanupTask item : cleanupTasks)
            if (item.itemCount != 0)
                DemoCleanup.cleanup (item.itemObjectApiName, item.itemWhereClause, item.itemPermanentlyDelete);

        DemoCleanupCustomApex.runCustomApex();

        // Cannot test for these since the work is done asynchronously ...
        // System.assertEquals(0, [SELECT count() FROM Account]);
        // System.assertEquals(0, [SELECT count() FROM Shipment]);

        Test.stopTest();
    }
}
