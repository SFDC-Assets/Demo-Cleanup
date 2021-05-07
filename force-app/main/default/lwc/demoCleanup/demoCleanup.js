//  Javascript controller for the Demo Cleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { subscribe, unsubscribe } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCleanupTasks from '@salesforce/apex/DemoCleanup.getCleanupTasks';
import saveOrderedTasks from '@salesforce/apex/DemoCleanup.saveOrderedTasks';
import startCleanup from '@salesforce/apex/DemoCleanup.startCleanup';
import getPreviewRecords from '@salesforce/apex/DemoCleanup.getPreviewRecords';

const MAXIMUM_CLEANUP_TASKS = 90;

const CLEANUP_TASK_LIST_VIEW_SPEC = {
	type: 'standard__objectPage',
	attributes: {
		objectApiName: 'Demo_Cleanup_Task__c',
		actionName: 'list'
	},
	state: {
		filterName: 'All'
	}
};

const NUMBER_OF_PREVIEW_RECORDS = 50;

export default class DemoCleanup extends NavigationMixin(LightningElement) {
	@api cardTitle = 'Demo Cleanup';

	@track cleanupTasks = [];
	get cleanupTasksEmpty() {
		return this.cleanupTasks.length === 0;
	}
	get numberOfCleanupTasks() {
		return this.cleanupTasks.length;
	}
	get tooManyCleanupTasks() {
		return this.numberOfCleanupTasks > MAXIMUM_CLEANUP_TASKS;
	}

	@track selectedRows = [];
	totalRecordsSelected = 0;
	totalPermanentRecordsSelected = 0;
	totalRecycleRecordsSelected = 0;
	totalSoqlItemsSelected = 0;
	totalApexItemsSelected = 0;
	totalFlowItemsSelected = 0;

	@track errorList = [];
	get showErrorList() {
		return this.deletionHadErrors && this.deletionFinished;
	}
	totalErrors = 0;
	errorListColumns = [
		{
			label: 'Record or Task',
			fieldName: 'link',
			type: 'url',
			initialWidth: 200,
			iconName: 'standard:record',
			cellAttributes: { alignment: 'left' },
			typeAttributes: {
				label: { fieldName: 'name' },
				tooltip: { fieldName: 'name' },
				target: '_blank'
			}
		},
		{
			label: 'Problem Fields',
			fieldName: 'fields',
			type: 'text',
			iconName: 'standard:first_non_empty',
			initialWidth: 200,
			wrapText: true,
			cellAttributes: { alignment: 'left' }
		},
		{
			label: 'Error Message',
			fieldName: 'message',
			type: 'text',
			iconName: 'standard:live_chat',
			wrapText: true,
			cellAttributes: { alignment: 'left' }
		}
	];

	get cleanupButtonDisabled() {
		return (
			!this.selectionsAndCleanupAllowed ||
			(this.totalSoqlItemsSelected === 0 && this.totalApexItemsSelected === 0 && this.totalFlowItemsSelected === 0)
		);
	}

	selectionsAndCleanupAllowed = true;
	get selectDisabled() {
		return !this.selectionsAndCleanupAllowed;
	}

	subscription;

	helpSectionVisible = false;
	spinnerVisible = false;
	confirmationModalVisible = false;

	previewModalVisible = false;
	@track previewList = [];
	previewTotalRows;
	previewTooManyRows;
	previewObjectApiName;
	previewWhereClause;
	previewOffset;
	previewLastOffset = 0;
	previewTaskLink;
	previewTaskDescription;
	previewListColumns = [
		{
			label: 'Record',
			fieldName: 'itemLink',
			type: 'url',
			wrapText: false,
			cellAttributes: { alignment: 'left' },
			typeAttributes: {
				label: { fieldName: 'itemName' },
				tooltip: { fieldName: 'itemName' },
				target: '_blank'
			}
		},
		{
			label: 'Owner',
			fieldName: 'itemOwnerLink',
			type: 'url',
			wrapText: false,
			cellAttributes: { alignment: 'left' },
			typeAttributes: {
				label: { fieldName: 'itemOwnerName' },
				tooltip: { fieldName: 'itemOwnerName' },
				target: '_blank'
			}
		},
		{
			label: 'Created',
			fieldName: 'itemCreatedDate',
			type: 'date',
			wrapText: false,
			cellAttributes: { alignment: 'center' },
			typeAttributes: {
				month: '2-digit',
				day: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			}
		},
		{
			label: 'Modified',
			fieldName: 'itemModifiedDate',
			type: 'date',
			wrapText: false,
			cellAttributes: { alignment: 'center' },
			typeAttributes: {
				month: '2-digit',
				day: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			}
		}
	];
	get previewRowsShowing() {
		return this.previewList.length;
	}

	deletionInProgress = false;
	deletionFinished = false;
	deletionHadErrors = false;

	cleanupTaskListViewUrl = '';

	dragSource;
	get draggable() {
		return !this.deletionInProgress;
	}

	connectedCallback() {
		this[NavigationMixin.GenerateUrl](CLEANUP_TASK_LIST_VIEW_SPEC).then((url) => (this.cleanupTaskListViewUrl = url));
		this.spinnerVisible = true;
	}

	@wire(getCleanupTasks)
	wired_getCleanupTasks({ data, error }) {
		this.spinnerVisible = false;
		this.cleanupTasks = [];
		if (data) {
			data.forEach((task) => {
				this.cleanupTasks.push({
					itemId: task.itemId,
					itemSelected: false,
					itemCheckboxDisabled: task.itemQueryError,
					itemOrder: task.itemOrder,
					itemRecordTypeName: task.itemRecordTypeName,
					itemIsSOQL: task.itemRecordTypeName === 'SOQL Cleanup Item',
					itemShowPreviewButton:
						task.itemRecordTypeName === 'SOQL Cleanup Item' && !task.itemQueryError && task.itemCount,
					itemApexClassName: task.itemApexClassName,
					itemFlowName: task.itemFlowApiName,
					itemObjectApiName: task.itemObjectApiName,
					itemDuplicateObjectTask: task.itemDuplicateObjectTask,
					itemWhereClause: task.itemWhereClause,
					itemDescription: task.itemDescription,
					itemPermanentlyDelete: task.itemPermanentlyDelete,
					itemIcon:
						task.itemRecordTypeName === 'Apex Cleanup Item'
							? 'utility:apex'
							: task.itemRecordTypeName === 'Flow Cleanup Item'
							? 'utility:flow'
							: 'utility:database',
					itemIconVariant: task.itemPermanentlyDelete ? 'error' : 'success',
					itemCompletionIcon: null,
					itemCompletionIconVariant: 'info',
					itemIconTooltip: task.itemPermanentlyDelete
						? 'Records will be permanently deleted'
						: 'Deleted records will be kept in recycle bin',
					itemCount: task.itemCount,
					itemQueryError: task.itemQueryError,
					itemLink: '/lightning/r/Demo_Cleanup_Task__c/' + task.itemId + '/view',
					itemInProgress: false,
					itemShowProgress: false,
					itemRunningTotal: 0,
					itemRemaining: task.itemCount,
					itemPercentage: 0,
					itemNumberOfRecordsWithErrors: 0,
					itemNumberOfErrors: 0,
					itemHasErrors: false,
					itemDeletionFinished: false
				});
				if (task.itemDuplicateObjectTask) {
					this.dispatchEvent(
						new ShowToastEvent({
							title: `Cleanup task "${task.itemDescription}" uses the same object as "${task.itemDuplicateObjectTask}"`,
							message: 'Combine the two Demo Cleanup Tasks into a single task with a unified WHERE clause.',
							variant: 'error',
							mode: 'sticky'
						})
					);
				} else if (task.itemQueryError) {
					let message;
					switch (task.itemRecordTypeName) {
						case 'Apex Cleanup Item':
							message =
								'Please check the Apex class and make sure it exists, is active, implements the "DemoCleanupApexItem" ' +
								'interface, and that you have permission to execute it.';
							break;
						case 'Flow Cleanup Item':
							message = 'Please check the flow and make sure it exists, is active, and is an autolaunched flow.';
							break;
						case 'SOQL Cleanup Item':
							message =
								'Please check the object API name (including any "__c") and WHERE clause expression for any bad syntax.';
							break;
					}
					this.dispatchEvent(
						new ShowToastEvent({
							message: message,
							title: `Cleanup task "${task.itemDescription}" has an error.`,
							variant: 'error',
							mode: 'sticky'
						})
					);
				}
			});
		} else if (error)
			this.dispatchEvent(
				new ShowToastEvent({
					message: `${JSON.stringify(error)}`,
					title: 'Error occurred trying to retrieve Demo Cleanup Tasks',
					variant: 'error',
					mode: 'sticky'
				})
			);
	}

	handleSelectAll(event) {
		this.cleanupTasks.forEach((task) => {
			task.itemCheckboxDisabled = task.itemQueryError || this.selectDisabled;
			task.itemSelected = !task.itemQueryError;
		});
		this.buildSelectedRowList();
		this.calculateSelectedTotals();
	}
	handleDeselectAll(event) {
		this.cleanupTasks.forEach((task) => {
			task.itemCheckboxDisabled = task.itemQueryError || this.selectDisabled;
			task.itemSelected = false;
		});
		this.buildSelectedRowList();
		this.calculateSelectedTotals();
	}

	showModal(event) {
		this.confirmationModalVisible = true;
	}

	handleCancelButton(event) {
		this.confirmationModalVisible = false;
		this.selectionsAndCleanupAllowed = true;
	}

	handleCleanupButton(event) {
		this.confirmationModalVisible = false;
		this.selectionsAndCleanupAllowed = false;
		this.cleanupTasks.forEach((task) => {
			task.itemCheckboxDisabled = true;
		});
		this.deletionInProgress = true;
		subscribe('/event/Demo_Cleanup_Event__e', -1, this.handlePlatformEvent.bind(this)).then((result) => {
			this.subscription = result;
		});
		startCleanup({ cleanupTaskListJSON: JSON.stringify(this.selectedRows) })
			.then((result) => {
				this.dispatchEvent(
					new ShowToastEvent({
						variant: 'info',
						mode: 'sticky',
						title: 'The demo cleanup process has started. PLEASE BE PATIENT.',
						message:
							'Depending on the load on the infrastructure, some items may take up to a few minutes to start. ' +
							'If you navigate away from this page, the cleanup will continue, but you will not be able to monitor the progress.'
					})
				);
			})
			.catch((error) => {
				this.dispatchEvent(
					new ShowToastEvent({
						message: JSON.stringify(error),
						title: 'Could not begin demo cleanup process.',
						variant: 'error',
						mode: 'sticky'
					})
				);
			});
	}

	handleHelpButton(event) {
		this.helpSectionVisible = !this.helpSectionVisible;
	}

	handleGoToDemoCleanupTasksButton(event) {
		this[NavigationMixin.Navigate](CLEANUP_TASK_LIST_VIEW_SPEC);
	}

	handlePlatformEvent(event) {
		let numberFinished = 0;
		let deletionHadErrors = false;
		let totalErrors = 0;
		this.cleanupTasks.forEach((cleanupTask) => {
			if (cleanupTask.itemId === event.data.payload.Task_Id__c) {
				cleanupTask.itemInProgress = true;
				cleanupTask.itemDeletionFinished = event.data.payload.Finished__c;
				cleanupTask.itemNumberOfRecordsWithErrors = event.data.payload.Total_Records_with_Errors__c;
				cleanupTask.itemNumberOfErrors = event.data.payload.Total_Errors__c;
				cleanupTask.itemHasErrors = cleanupTask.itemNumberOfErrors > 0;
				switch (cleanupTask.itemRecordTypeName) {
					case 'SOQL Cleanup Item':
						cleanupTask.itemRunningTotal = event.data.payload.Total_Records_Deleted__c;
						cleanupTask.itemRemaining =
							cleanupTask.itemCount - cleanupTask.itemRunningTotal + cleanupTask.itemNumberOfRecordsWithErrors;
						cleanupTask.itemPercentage = cleanupTask.itemDeletionFinished
							? 100
							: Math.round((100 * cleanupTask.itemRunningTotal) / cleanupTask.itemCount);
						break;
					case 'Apex Cleanup Item':
					case 'Flow Cleanup Item':
						if (cleanupTask.itemDeletionFinished) {
							cleanupTask.itemRunningTotal = null;
							cleanupTask.itemRemaining = null;
							cleanupTask.itemPercentage = 100;
						} else {
							cleanupTask.itemRunningTotal = 0;
							cleanupTask.itemRemaining = 1;
							cleanupTask.itemPercentage = 0;
						}
						break;
				}
				if (event.data.payload.Error_JSON_String__c)
					JSON.parse(event.data.payload.Error_JSON_String__c).forEach((error) => this.errorList.push(error));
				cleanupTask.itemInProgress = !cleanupTask.itemDeletionFinished;
				cleanupTask.itemShowProgress = cleanupTask.itemInProgress || cleanupTask.itemHasErrors;
				if (cleanupTask.itemDeletionFinished) {
					cleanupTask.itemCompletionIcon = cleanupTask.itemHasErrors ? 'utility:error' : 'utility:success';
					cleanupTask.itemCompletionIconVariant = cleanupTask.itemHasErrors ? 'error' : 'success';
				} else {
					cleanupTask.itemCompletionIcon = 'utility:threedots';
					cleanupTask.itemCompletionIconVariant = 'info';
				}
			}
			totalErrors += cleanupTask.itemNumberOfErrors;
			if (cleanupTask.itemDeletionFinished) numberFinished++;
			deletionHadErrors = deletionHadErrors || cleanupTask.itemHasErrors;
		});
		this.totalErrors = totalErrors;
		this.deletionFinished = numberFinished === this.selectedRows.length;
		this.deletionHadErrors = deletionHadErrors;
		if (this.deletionFinished) {
			this.deletionInProgress = false;
			unsubscribe(this.subscription, () => (this.subscription = {}));
			if (this.deletionHadErrors)
				this.dispatchEvent(
					new ShowToastEvent({
						variant: 'error',
						mode: 'sticky',
						message: 'Demo cleanup has completed but one or more tasks had errors.'
					})
				);
			else
				this.dispatchEvent(
					new ShowToastEvent({
						variant: 'success',
						mode: 'sticky',
						message: 'Demo cleanup has completed without any errors.'
					})
				);
		}
	}

	handlePreviewButton(event) {
		const index = this.cleanupTasks.findIndex((task) => task.itemId === event.target.getAttribute('data-id'));
		this.previewList = [];
		this.previewOffset = 0;
		this.previewLastOffset = 0;
		this.previewTotalRows = this.cleanupTasks[index].itemCount;
		this.previewTooManyRows = this.cleanupTasks[index].itemCount > 2000;
		this.previewObjectApiName = this.cleanupTasks[index].itemObjectApiName;
		this.previewWhereClause = this.cleanupTasks[index].itemWhereClause;
		this.previewTaskLink = this.cleanupTasks[index].itemLink;
		this.previewTaskDescription = this.cleanupTasks[index].itemDescription;
		this.loadPreviewData();
		this.previewModalVisible = true;
	}

	loadPreviewData() {
		return getPreviewRecords({
			objectApiName: this.previewObjectApiName,
			whereClause: this.previewWhereClause,
			numberOfRecords: NUMBER_OF_PREVIEW_RECORDS,
			offset: this.previewOffset
		}).then((result) => {
			this.previewList = [...this.previewList, ...result];
		});
	}

	handlePreviewLoadMore(event) {
		const { target } = event;
		target.isLoading = true;
		this.previewOffset += NUMBER_OF_PREVIEW_RECORDS;
		this.loadPreviewData().then(() => {
			target.isLoading = false;
			// We cannot do a SOQL query with an offset greater than 2000.
			if (this.previewList.length >= this.previewTotalRows || this.previewList.length >= 2000)
				target.enableInfiniteLoading = false;
		});
	}

	handlePreviewCancelButton(event) {
		this.previewModalVisible = false;
	}

	handleRowSelection(event) {
		const index = this.cleanupTasks.findIndex((task) => task.itemId === event.target.getAttribute('data-id'));
		this.cleanupTasks[index].itemSelected = event.target.checked;
		this.buildSelectedRowList();
		this.calculateSelectedTotals();
	}

	calculateSelectedTotals() {
		this.totalRecordsSelected = 0;
		this.totalPermanentRecordsSelected = 0;
		this.totalRecycleRecordsSelected = 0;
		this.totalSoqlItemsSelected = 0;
		this.totalApexItemsSelected = 0;
		this.totalFlowItemsSelected = 0;
		this.selectedRows.forEach((item) => {
			switch (item.itemRecordTypeName) {
				case 'SOQL Cleanup Item':
					if (item.itemCount !== 0) {
						if (!item.itemQueryError) this.totalSoqlItemsSelected++;
						this.totalRecordsSelected += item.itemCount;
						this.totalPermanentRecordsSelected += item.itemPermanentlyDelete ? item.itemCount : 0;
						this.totalRecycleRecordsSelected += item.itemPermanentlyDelete ? 0 : item.itemCount;
					}
					break;
				case 'Apex Cleanup Item':
					if (!item.itemQueryError) this.totalApexItemsSelected++;
					break;
				case 'Flow Cleanup Item':
					if (!item.itemQueryError) this.totalFlowItemsSelected++;
					break;
			}
		});
	}

	buildSelectedRowList() {
		this.selectedRows = [];
		this.template.querySelectorAll('.checkbox').forEach((row) => {
			const task = this.cleanupTasks.find((item) => item.itemId === row.getAttribute('data-id'));
			if (
				task.itemSelected &&
				!task.itemQueryError &&
				!(task.itemRecordTypeName === 'SOQL Cleanup Item' && task.itemCount === 0)
			) {
				this.selectedRows.push({
					itemId: task.itemId,
					itemOrder: task.itemOrder,
					itemRecordTypeName: task.itemRecordTypeName,
					itemApexClassName: task.itemApexClassName,
					itemFlowApiName: task.itemFlowName,
					itemObjectApiName: task.itemObjectApiName,
					itemDuplicateObjectTask: task.itemDuplicateObjectTask,
					itemDescription: task.itemDescription,
					itemWhereClause: task.itemWhereClause,
					itemPermanentlyDelete: task.itemPermanentlyDelete,
					itemCount: task.itemCount,
					itemQueryError: task.itemQueryError
				});
			}
		});
	}

	isbefore(a, b) {
		if (a.parentNode == b.parentNode) {
			for (let cur = a; cur; cur = cur.previousSibling) {
				if (cur === b) return true;
			}
		}
		return false;
	}

	handleDragEnter(event) {
		// Find the first <TR> node encapsulating whatever subnode we clicked on while dragging the row.
		let targetelem = event.target;
		while (targetelem.nodeName !== 'TR') targetelem = targetelem.parentNode;

		if (this.isbefore(this.dragSource, targetelem)) targetelem.parentNode.insertBefore(this.dragSource, targetelem);
		else targetelem.parentNode.insertBefore(this.dragSource, targetelem.nextSibling);
	}

	handleDragStart(event) {
		this.dragSource = event.target;
		event.dataTransfer.effectAllowed = 'move';
		this.dragSource.classList.add('dragging', 'slds-drop-zone', 'slds-theme_shade');
	}

	handleDragEnd(event) {
		this.dragSource.classList.remove('dragging', 'slds-drop-zone', 'slds-theme_shade');
		this.updateOrderFromUI();
	}

	updateOrderFromUI() {
		// Get the rows from the table in the UI and record their order in the cleanupTasks array. Then sort the array by order.
		let rows = this.template.querySelector('table.cleanup-task-list').rows;
		for (let rowNumber = 0; rowNumber < rows.length; rowNumber++) {
			const id = rows.item(rowNumber).getAttribute('data-id');
			const taskIndex = this.cleanupTasks.findIndex((task) => task.itemId === id);
			this.cleanupTasks[taskIndex].itemOrder = rowNumber;
		}
		this.cleanupTasks.sort((a, b) => a.itemOrder - b.itemOrder);

		//  Save the new order of demo cleanup tasks in the database.
		let orderedMap = {};
		this.cleanupTasks.forEach((task) => {
			orderedMap[task.itemId] = task.itemOrder;
		});
		saveOrderedTasks({ orderedMapJSON: JSON.stringify(orderedMap) }).catch((error) => {
			this.dispatchEvent(
				new ShowToastEvent({
					message: JSON.stringify(error),
					title: 'Error saving new Demo Cleanup Task order',
					variant: 'error',
					mode: 'sticky'
				})
			);
		});
	}
}
