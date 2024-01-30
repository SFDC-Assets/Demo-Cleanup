/**
 *  Batch date delete methods for the DemoCleanup Lightning component.
 *
 *  Copyright (c) 2021-2024, Salesforce.com, Inc.
 *  All rights reserved.
 *  SPDX-License-Identifier: BSD-3-Clause
 *  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 *  @author john.meyer@salesforce.com
 *  @see    <a href="https://github.com/SFDC-Assets/Demo-Cleanup">Demo Cleanup documentation</a>
 */

public without sharing class DemoCleanupBatch implements Database.Batchable<SObject>, Database.Stateful {

	private List<DemoCleanup.CleanupTask> cleanupTaskList;
	private Integer currentIndex;
	private Id taskId;
	private String sObjectApiName;
	private String nameField;
	private String whereClause;
	private Boolean permanentlyDelete;

	private Integer totalRecordsProcessed = 0;
	private Integer totalRecordsWithErrors = 0;
	private Integer totalErrors = 0;


	/**
	 *  Constructor method that gathers the information for the batch job and builds the query string.
	 *
	 *  @param cleanupTaskList	the entire list of cleanup tasks.
	 *  @param currentIndex		the zero-based index into cleanupTaskList of the current cleanup task.
	 */

	public DemoCleanupBatch (List<DemoCleanup.CleanupTask> cleanupTaskList, Integer currentIndex) {
		this.cleanupTaskList = cleanupTaskList;
		this.currentIndex = currentIndex;
		this.taskId = cleanupTaskList[currentIndex].itemId;
		this.sObjectApiName = cleanupTaskList[currentIndex].itemObjectApiName;
		this.nameField = DemoCleanup.getNameField(cleanupTaskList[currentIndex].itemObjectApiName);
		this.whereClause = cleanupTaskList[currentIndex].itemWhereClause;
		this.permanentlyDelete = cleanupTaskList[currentIndex].itemPermanentlyDelete;
	}

	//  Specify the query.

	public Database.QueryLocator start (Database.BatchableContext bc) {
		return Database.getQueryLocator('SELECT ' + this.nameField + ' FROM ' + this.sObjectApiName +
			(this.whereClause == null ? '' : ' WHERE (' + this.whereClause + ')') + ' WITH SYSTEM_MODE'
		);
	}

	//  Delete records by the batch.

	public void execute (Database.BatchableContext bc, List<SObject> chunk) {

		Integer recordNumber = 0;
		List<DemoCleanup.ErrorSpec> errors = new List<DemoCleanup.ErrorSpec>();

		for (Database.DeleteResult result : Database.delete(chunk, false, AccessLevel.SYSTEM_MODE)) {
			if (!result.isSuccess()) {
				this.totalRecordsWithErrors++;
				for (Database.Error dberror : result.getErrors()) {
					DemoCleanup.ErrorSpec error = new DemoCleanup.ErrorSpec();
					error.id = result.getId();
					error.name = String.valueOf(chunk[recordNumber].get(this.nameField));
					error.link = '/lightning/r/' + this.sObjectApiName + '/' + error.id + '/view';
					error.fields = String.join(dberror.getFields(), ', ');
					error.message = dberror.getMessage();
					errors.add(error);
				}
			}
			recordNumber++;
		}
		if (this.permanentlyDelete) {
			Database.emptyRecycleBin(chunk);
		}

		this.totalRecordsProcessed += chunk.size();
		this.totalErrors += errors.size();

		EventBus.publish(
			new Demo_Cleanup_Event__e (
				Task_Id__c = this.taskId,
				Finished__c = false,
				Object_API_Name__c = this.sObjectApiName,
				Total_Records_Deleted__c = this.totalRecordsProcessed,
				Total_Records_with_Errors__c = this.totalRecordsWithErrors,
				Total_Errors__c = this.totalErrors,
				Error_JSON_String__c = JSON.serialize(errors)
			)
		);
	}

	//  Make sure we notify the component that we are done and go kick off the next task.

	public void finish (Database.BatchableContext bc) {
		EventBus.publish(
			new Demo_Cleanup_Event__e (
				Task_Id__c = this.taskId,
				Finished__c = true,
				Object_API_Name__c = this.sObjectApiName,
				Total_Records_Deleted__c = this.totalRecordsProcessed,
				Total_Records_with_Errors__c = this.totalRecordsWithErrors,
				Total_Errors__c = this.totalErrors,
				Error_JSON_String__c = '[]'
			)
		);
		DemoCleanup.cleanup(this.cleanupTaskList, this.currentIndex + 1);
	}
}
