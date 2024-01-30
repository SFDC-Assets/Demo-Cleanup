/**
 *  Asynchronous Apex method invocation for the DemoCleanup Lightning component.
 *
 *  Copyright (c) 2021-2024, Salesforce.com, Inc.
 *  All rights reserved.
 *  SPDX-License-Identifier: BSD-3-Clause
 *  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 *  @author john.meyer@salesforce.com
 *  @see    <a href="https://github.com/SFDC-Assets/Demo-Cleanup">Demo Cleanup documentation</a>
 */

public without sharing class DemoCleanupApex implements Queueable {

    private List<DemoCleanup.CleanupTask> cleanupTaskList;
    private Integer currentIndex;

    
    /**
     *  Constructor method that gathers the information for the queuable.
	 *
	 *  @param cleanupTaskList  the entire list of cleanup tasks.
	 *  @param currentIndex     the zero-based index into cleanupTaskList of the current cleanup task.
     */
 
    public DemoCleanupApex (List<DemoCleanup.CleanupTask> cleanupTaskList, Integer currentIndex) {
        this.cleanupTaskList = cleanupTaskList;
        this.currentIndex = currentIndex;
    }

    
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
            ((DemoCleanupApexItem) Type.forName(task.itemApexClassName).newInstance()).execute(task.itemId);
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
            error.message = 'Could not run the "execute" method of Apex class "' + task.itemApexClassName +
                '". Make sure it exists and implements the DemoCleanupApexItem interface.';
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
