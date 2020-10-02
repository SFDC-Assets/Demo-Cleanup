//  Batch date delete methods for the DemoCleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

global without sharing class DemoCleanupBatch implements Database.Batchable<sObject>, Database.Stateful, Database.RaisesPlatformEvents {
	private Id taskId;
	private String sObjectApiName;
	private String nameField;
	private String whereClause;
	private Boolean permanentlyDelete;

	private Integer totalRecordsProcessed = 0;
	private Integer totalErrors = 0;

	//  Class used by the execute() method to collect error information to send back to the component.

	private class ErrorSpec {
		private Id id;
		private String name;
		private String link;
		private String fields;
		private String message;
	}

	//  Constructor method that gathers the information for the batch job and builds the query string.
	//
	//  The parameters represent:
	//      taskId:  the Id of the task record specifying the cleanup task.
	//      sObjectApiName:  the API name of the object whose records we will delete.
	//      nameField:  the field containing the name of the object (usually 'Name', but could be something else ('CaseNumber' for Case, e.g.))
	//      whereClause:  the SOQL WHERE clause that identifies the records to be deleted.
	//      permanentlyDelete:  True if the records are to bypass the recycle bin and be permanently deleted.

	global DemoCleanupBatch(Id taskId, String sObjectApiName, String nameField, String whereClause, Boolean permanentlyDelete) {
		this.taskId = taskId;
		this.sObjectApiName = sObjectApiName;
		this.nameField = nameField;
		this.whereClause = whereClause;
		this.permanentlyDelete = permanentlyDelete;
	}

	//  Specify the query.

	global Database.QueryLocator start(Database.BatchableContext bc) {
		return Database.getQueryLocator('SELECT ' + this.nameField + ' FROM ' + this.sObjectApiName +
			(this.whereClause == null ? '' : ' WHERE ' + this.whereClause)
		);
	}

	//  Delete records by the batch.

	global void execute(Database.BatchableContext bc, List<sObject> chunk) {
		Integer recordNumber = 0;
		List<ErrorSpec> errors = new List<ErrorSpec>();

		for (Database.DeleteResult result : Database.delete(chunk, false)) {
			if (!result.isSuccess())
				for (Database.Error dberror : result.getErrors()) {
					ErrorSpec error = new ErrorSpec();
					error.id = result.getId();
					error.name = (String) chunk[recordNumber].get(this.nameField);
					error.link = '/lightning/r/' + this.sObjectApiName + '/' + result.getId() + '/view';
					error.fields = String.join(dberror.getFields(), ', ');
					error.message = dberror.getMessage();
					errors.add(error);
				}
			recordNumber++;
		}
		if (this.permanentlyDelete)
			Database.emptyRecycleBin(chunk);

		this.totalRecordsProcessed += chunk.size();
		this.totalErrors += errors.size();

		EventBus.publish(
			new Demo_Cleanup_Event__e(
				Task_Id__c = this.taskId,
				Finished__c = false,
				Object_API_Name__c = this.sObjectApiName,
				Total_Records_Deleted__c = this.totalRecordsProcessed,
				Total_Errors__c = this.totalErrors,
				Error_JSON_String__c = JSON.serialize(errors)
			)
		);
	}

	//  Make sure we notify the component that we are done.

	global void finish(Database.BatchableContext bc) {
		EventBus.publish(
			new Demo_Cleanup_Event__e(
				Task_Id__c = this.taskId,
				Finished__c = true,
				Object_API_Name__c = this.sObjectApiName,
				Total_Records_Deleted__c = this.totalRecordsProcessed,
				Total_Errors__c = this.totalErrors,
				Error_JSON_String__c = '[]'
			)
		);
	}
}
