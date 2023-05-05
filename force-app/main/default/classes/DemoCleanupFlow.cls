//  Asynchronous flow invocation for the DemoCleanup Lightning component.
//
//  Copyright (c) 2021-2023, salesforce.com, inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

public without sharing class DemoCleanupFlow implements Queueable {

    private List<DemoCleanup.CleanupTask> cleanupTaskList;
    private Integer currentIndex;


	//  Constructor method that gathers the information for the queuable.
	//
	//  The parameters represent:
	//      cleanupTaskList:  the entire list of cleanup tasks
	//      currentIndex: The zero-based index into cleanupTaskList of the current cleanup task
 
    public DemoCleanupFlow (List<DemoCleanup.CleanupTask> cleanupTaskList, Integer currentIndex) {
        this.cleanupTaskList = cleanupTaskList;
        this.currentIndex = currentIndex;
    }


    //  Execute the flow.

    public void execute (QueueableContext context) {

        DemoCleanup.CleanupTask task = this.cleanupTaskList[this.currentIndex];

        EventBus.publish(
            new Demo_Cleanup_Event__e (
                Task_Id__c = task.itemId,
                Finished__c = false,
                Object_API_Name__c = null,
                Total_Records_Deleted__c = null,
                Total_Records_with_Errors__c = 0,
                Total_Errors__c = 0,
                Error_JSON_String__c = '[]'
            )
        );    
        try {
            Flow.Interview.createInterview(task.itemFlowApiName, new Map<String,Id> { 'DemoCleanupTaskId' => task.itemId }).start();
            EventBus.publish(
                new Demo_Cleanup_Event__e (
                    Task_Id__c = task.itemId,
                    Finished__c = true,
                    Object_API_Name__c = null,
                    Total_Records_Deleted__c = null,
                    Total_Records_with_Errors__c = 0,
                    Total_Errors__c = 0,
                    Error_JSON_String__c = '[]'
                )
            );    
        } catch (Exception e) {
            DemoCleanup.ErrorSpec error = new DemoCleanup.ErrorSpec();
            error.id = task.itemId;
            error.name = task.itemDescription;
            error.link = '/lightning/r/Demo_Cleanup_Task__c/' + task.itemId + '/view';
            error.fields = null;
            error.message = 'Could not run the flow  "' + task.itemFlowApiName + '". Make sure it exists and is an autolaunched flow.';
            EventBus.publish(
                new Demo_Cleanup_Event__e (
                    Task_Id__c = task.itemId,
                    Finished__c = true,
                    Object_API_Name__c = null,
                    Total_Records_Deleted__c = null,
                    Total_Records_with_Errors__c = 1,
                    Total_Errors__c = 1,
                    Error_JSON_String__c = JSON.serialize(new List<DemoCleanup.ErrorSpec> { error })
                )
            );    
        } finally {
            DemoCleanup.cleanup(this.cleanupTaskList, this.currentIndex + 1);
        }
    }

}