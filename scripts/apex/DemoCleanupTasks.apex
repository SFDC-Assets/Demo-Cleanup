insert new Demo_Cleanup_Task__c (
    Object_API_Name__c = 'Shipment',
    Description__c = 'Delete all shipments',
    Permanently_Delete__c = true,
    Active__c = true
);

insert new Demo_Cleanup_Task__c (
    Object_API_Name__c = 'Account',
    Description__c = 'Delete all accounts where SIC code is "Test"',
    SOQL_Where_Clause__c = 'Sic = \'Test\'',
    Permanently_Delete__c = false,
    Active__c = true
);

insert new Demo_Cleanup_Task__c (
    Object_API_Name__c = 'Contact',
    Description__c = 'Delete all contacts',
    Permanently_Delete__c = true,
    Active__c = true
);