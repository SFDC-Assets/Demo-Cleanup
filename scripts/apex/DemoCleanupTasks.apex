//  Generates sample demo cleanup tasks for the Demo Cleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

Map<String,Schema.RecordTypeInfo> rtInfo = Demo_Cleanup_Task__c.SObjectType.getDescribe().getRecordTypeInfosByName();
Id soqlRecordTypeId = rtInfo.get('SOQL Cleanup Item').getRecordTypeId();
Id apexRecordTypeId = rtInfo.get('Apex Cleanup Item').getRecordTypeId();

insert new Demo_Cleanup_Task__c (
    RecordTypeId = soqlRecordTypeId,
    Object_API_Name__c = 'Shipment',
    Description__c = 'Delete all shipments',
    Permanently_Delete__c = true,
    Active__c = true
);

insert new Demo_Cleanup_Task__c (
    RecordTypeId = apexRecordTypeId,
    Apex_Class_Name__c = 'DemoCleanupCustomApex',
    Description__c = 'Run custom Apex',
    Permanently_Delete__c = false,
    Active__c = true
);

insert new Demo_Cleanup_Task__c (
    RecordTypeId = soqlRecordTypeId,
    Object_API_Name__c = 'Account',
    Description__c = 'Delete all accounts where SIC code is "Test"',
    SOQL_Where_Clause__c = 'Sic = \'Test\'',
    Permanently_Delete__c = false,
    Active__c = true
);

insert new Demo_Cleanup_Task__c (
    RecordTypeId = soqlRecordTypeId,
    Object_API_Name__c = 'Contact',
    Description__c = 'Delete all contacts',
    Permanently_Delete__c = true,
    Active__c = true
);
