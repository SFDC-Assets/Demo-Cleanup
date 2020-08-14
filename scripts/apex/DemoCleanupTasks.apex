Map<String,Schema.RecordTypeInfo> rtInfo = Demo_Cleanup_Task__c.SObjectType.getDescribe().getRecordTypeInfosByName();
Id soqlRecordTypeId = rtInfo.get('SOQL Cleanup Item').getRecordTypeId();
Id apexRecordTypeId = rtInfo.get('Apex Cleanup Item').getRecordTypeId();

insert new Demo_Cleanup_Task__c (
    RecordTypeId = soqlRecordTypeId,
    Order_In_List__c = 1,
    Object_API_Name__c = 'Shipment',
    Description__c = 'Delete all shipments',
    Permanently_Delete__c = true,
    Active__c = true
);

insert new Demo_Cleanup_Task__c (
    RecordTypeId = apexRecordTypeId,
    Order_In_List__c = 2,
    Apex_Class_Name__c = 'DemoCleanupCustomApex',
    Description__c = 'Run custom Apex',
    Permanently_Delete__c = false,
    Active__c = true
);

insert new Demo_Cleanup_Task__c (
    RecordTypeId = soqlRecordTypeId,
    Order_In_List__c = 3,
    Object_API_Name__c = 'Account',
    Description__c = 'Delete all accounts where SIC code is "Test"',
    SOQL_Where_Clause__c = 'Sic = \'Test\'',
    Permanently_Delete__c = false,
    Active__c = true
);

insert new Demo_Cleanup_Task__c (
    RecordTypeId = soqlRecordTypeId,
    Order_In_List__c = 4,
    Object_API_Name__c = 'Contact',
    Description__c = 'Delete all contacts',
    Permanently_Delete__c = true,
    Active__c = true
);