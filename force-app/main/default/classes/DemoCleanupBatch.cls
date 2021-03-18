//  Batch date delete methods for the DemoCleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

public without sharing class DemoCleanupBatch implements Database.Batchable<sObject>, Database.Stateful {

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


	//  Constructor method that gathers the information for the batch job and builds the query string.
	//
	//  The parameters represent:
	//      cleanupTaskList:  the entire list of cleanup tasks
	//      currentIndex:  the zero-based index into cleanupTaskList of the current cleanup task

	public DemoCleanupBatch (List<DemoCleanup.CleanupTask> cleanupTaskList, Integer currentIndex) {
		this.cleanupTaskList = cleanupTaskList;
		this.currentIndex = currentIndex;
		this.taskId = cleanupTaskList[currentIndex].itemId;
		this.sObjectApiName = cleanupTaskList[currentIndex].itemObjectApiName;
		this.nameField = getNameField(cleanupTaskList[currentIndex].itemObjectApiName);
		this.whereClause = cleanupTaskList[currentIndex].itemWhereClause;
		this.permanentlyDelete = cleanupTaskList[currentIndex].itemPermanentlyDelete;
	}

	//  Specify the query.

	public Database.QueryLocator start(Database.BatchableContext bc) {
		return Database.getQueryLocator('SELECT ' + this.nameField + ' FROM ' + this.sObjectApiName +
			(this.whereClause == null ? '' : ' WHERE ' + this.whereClause)
		);
	}

	//  Delete records by the batch.

	public void execute (Database.BatchableContext bc, List<sObject> chunk) {

		Integer recordNumber = 0;
		List<DemoCleanup.ErrorSpec> errors = new List<DemoCleanup.ErrorSpec>();

		for (Database.DeleteResult result : Database.delete(chunk, false)) {
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
				Total_Records_with_Errors__c = this.totalRecordsWithErrors,
				Total_Errors__c = this.totalErrors,
				Error_JSON_String__c = JSON.serialize(errors)
			)
		);
	}

	//  Make sure we notify the component that we are done and go kick off the next task.

	public void finish (Database.BatchableContext bc) {
		EventBus.publish(
			new Demo_Cleanup_Event__e(
				Task_Id__c = this.taskId,
				Finished__c = true,
				Object_API_Name__c = this.sObjectApiName,
				Total_Records_Deleted__c = this.totalRecordsProcessed,
				Total_Records_with_Errors__c = this.totalRecordsWithErrors,
				Total_Errors__c = this.totalErrors,
				Error_JSON_String__c = '[]'
			)
		);
		DemoCleanup.cleanup(cleanupTaskList, currentIndex + 1);
	}


    //  Find the name field for an object.

    private static String getNameField (String objectApiName) {
        String name;
        for (Schema.SObjectField field : Schema.getGlobalDescribe().get(objectApiName).getDescribe().fields.getMap().values())
            if (field.getDescribe().isNameField()) {
                name = field.getDescribe().getName();
                break;
            }
        return name;
    }
}
