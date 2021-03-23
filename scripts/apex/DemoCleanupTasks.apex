//  Generates sample demo cleanup tasks for the Demo Cleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

Map<String,Schema.RecordTypeInfo> rtInfo = Demo_Cleanup_Task__c.SObjectType.getDescribe().getRecordTypeInfosByName();
Id soqlRecordTypeId = rtInfo.get('SOQL Cleanup Item').getRecordTypeId();
Id apexRecordTypeId = rtInfo.get('Apex Cleanup Item').getRecordTypeId();
Id flowRecordTypeId = rtInfo.get('Flow Cleanup Item').getRecordTypeId();

List<Demo_Cleanup_Task__c> cleanupTasks = new List<Demo_Cleanup_Task__c> {

    new Demo_Cleanup_Task__c (
        RecordTypeId = apexRecordTypeId,
        Apex_Class_Name__c = 'DemoCleanupCustomApex',
        Description__c = 'Run the Demo Cleanup test Apex method which posts to the user\'s Chatter feed',
        Permanently_Delete__c = false,
        Active__c = true
    ),

    new Demo_Cleanup_Task__c (
        RecordTypeId = soqlRecordTypeId,
        Object_API_Name__c = 'Case',
        Description__c = 'Delete all cases',
        Permanently_Delete__c = true,
        Active__c = true
    ),

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
        Description__c = 'Delete all contacts',
        Permanently_Delete__c = true,
        Active__c = true
    ),

    new Demo_Cleanup_Task__c (
        RecordTypeId = flowRecordTypeId,
        Flow_API_Name__c = 'Demo_Cleanup_Flow_Item_Test',
        Description__c = 'Run the Demo Cleanup test flow which posts to user\'s Chatter feed',
        Active__c = true
    ),

    new Demo_Cleanup_Task__c (
        RecordTypeId = soqlRecordTypeId,
        Object_API_Name__c = 'Task',
        Description__c = 'Delete all tasks',
        Permanently_Delete__c = true,
        Active__c = true
    ),

    new Demo_Cleanup_Task__c (
        RecordTypeId = soqlRecordTypeId,
        Object_API_Name__c = 'Event',
        Description__c = 'Delete all events',
        Permanently_Delete__c = true,
        Active__c = true
    ),

    new Demo_Cleanup_Task__c (
        RecordTypeId = soqlRecordTypeId,
        Object_API_Name__c = 'Campaign',
        Description__c = 'Delete all campaigns',
        Permanently_Delete__c = true,
        Active__c = true
    ),

    new Demo_Cleanup_Task__c (
        RecordTypeId = soqlRecordTypeId,
        Object_API_Name__c = 'Account',
        SOQL_Where_Clause__c = 'bad syntax',
        Description__c = 'Bad WHERE clause should generate an error',
        Permanently_Delete__c = false,
        Active__c = true
    ),

    new Demo_Cleanup_Task__c (
        RecordTypeId = apexRecordTypeId,
        Apex_Class_Name__c = 'BadApexClass',
        Description__c = 'Bad Apex class should generate an error',
        Permanently_Delete__c = true,
        Active__c = true
    ),

    new Demo_Cleanup_Task__c (
        RecordTypeId = flowRecordTypeId,
        Flow_API_Name__c = 'BadFlowName',
        Description__c = 'Bad flow name should generate an error',
        Active__c = true
    )

};
insert cleanupTasks;