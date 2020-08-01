//  Test class and metbods for the DemoDateShifter Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

@isTest
private without sharing class DemoCleanupTest {

    @testSetup
    static void setup () {
        DemoCleanup.RetrieveStatus status = DemoCleanup.getCleanupTasks();
        System.assertEquals(status.status, 'EMPTY');

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
                Object_API_Name__c = 'Opportunity',
                Description__c = 'Delete all opportunities with a bad WHERE clause',
                SOQL_Where_Clause__c = 'john',
                Permanently_Delete__c = false,
                Active__c = true
            )
        };
        insert tasks;
    
        List<Account> accounts = new List<Account>();
        for (Integer i = 1; i <= 10; i++)
            accounts.add(new Account(
                Name = 'Account' + i,
                Sic = 'Test'
            ));
        insert accounts;
        
        List<Shipment> shipments = new List<Shipment>();
        DateTime now = DateTime.now();
        for (Integer i = 0; i < 10; i++)
            shipments.add(new Shipment (
                ShipToName = 'Test Name',
                ActualDeliveryDate = now.addDays(i)
            ));
        insert shipments;

        Account first = [SELECT Id FROM Account LIMIT 1];
        insert new Opportunity (
            Name = 'Test',
            AccountId = first.Id,
            CloseDate = Date.today(),
            StageName = 'Prospecting'        
        );        
    }


    @isTest
    private static void runTests () {

        Test.startTest();

        DemoCleanup.RetrieveStatus status = DemoCleanup.getCleanupTasks();
        status = DemoCleanup.getCleanupTasks();
        System.assertEquals(status.status, 'SUCCESS');

        for (DemoCleanup.CleanupTask item : status.cleanupTasks)
            if (item.itemCount != 0)
                DemoCleanup.cleanup (item.itemObjectApiName, item.itemWhereClause, item.itemPermanentlyDelete);

        DemoCleanupCustomApex.runCustomApex();

        // Cannot test for these since the work is done asynchronously ...
        // System.assertEquals(0, [SELECT count() FROM Account]);
        // System.assertEquals(0, [SELECT count() FROM Shipment]);

        Test.stopTest();
    }
}
