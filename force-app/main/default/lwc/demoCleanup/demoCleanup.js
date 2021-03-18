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

export default class DemoCleanup extends NavigationMixin(LightningElement) {
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
				tooltip: { fieldName: 'id' },
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

	@api cardTitle = 'Demo Cleanup';

	@track cleanupTasks = [];
	@track selectedRows = [];
	@track errorList = [];
	get showErrorList() {
		return this.deletionHadErrors && this.deletionFinished;
	}

	totalRecordsSelected = 0;
	totalPermanentRecordsSelected = 0;
	totalRecycleRecordsSelected = 0;
	totalSoqlItemsSelected = 0;
	totalApexItemsSelected = 0;
	totalFlowItemsSelected = 0;
	totalErrors = 0;

	get cleanupTasksEmpty() {
		return this.cleanupTasks.length === 0;
	}
	get numberOfCleanupTasks() {
		return this.cleanupTasks.length;
	}
	maximumCleanupTasks = 90;
	get tooManyCleanupTasks() {
		return this.numberOfCleanupTasks > this.maximumCleanupTasks;
	}

	get cleanupButtonDisabled() {
		return (
			!this.selectionsAndCleanupAllowed ||
			(this.totalSoqlItemsSelected === 0 && this.totalApexItemsSelected === 0 && this.totalFlowItemsSelected === 0)
		);
	}
	get selectDisabled() {
		return !this.selectionsAndCleanupAllowed;
	}
	selectionsAndCleanupAllowed = true;

	subscription = {};

	helpSectionVisible = false;
	spinnerVisible = false;
	modalVisible = false;

	deletionInProgress = false;
	deletionFinished = false;
	deletionHadErrors = false;

	cleanupTaskListViewUrl = '';
	cleanupTaskListViewSpec = {
		type: 'standard__objectPage',
		attributes: {
			objectApiName: 'Demo_Cleanup_Task__c',
			actionName: 'list'
		},
		state: {
			filterName: 'All'
		}
	};

	dragSource;
	get draggable() {
		return !this.deletionInProgress;
	}

	connectedCallback() {
		this[NavigationMixin.GenerateUrl](this.cleanupTaskListViewSpec).then((url) => {
			this.cleanupTaskListViewUrl = url;
		});
		this.spinnerVisible = true;
	}

	@wire(getCleanupTasks)
	wired_getCleanupTasks({ data, error }) {
		this.spinnerVisible = false;
		this.cleanupTasks = [];
		this.totalSoqlItemsRetrieved = 0;
		if (data) {
			data.forEach((task) => {
				this.cleanupTasks.push({
					itemId: task.itemId,
					itemSelected: false,
					itemOrder: task.itemOrder,
					itemRecordTypeName: task.itemRecordTypeName,
					itemIsSOQL: task.itemRecordTypeName === 'SOQL Cleanup Item',
					itemApexClassName: task.itemApexClassName,
					itemFlowName: task.itemFlowApiName,
					itemObjectApiName: task.itemObjectApiName,
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
					itemCount: task.itemCount === null || task.itemCount === undefined ? null : task.itemCount,
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
				if (task.itemRecordTypeName === 'SOQL Cleanup Item') this.totalSoqlItemsRetrieved++;
				if (task.itemQueryError)
					this.dispatchEvent(
						new ShowToastEvent({
							title: `Cleanup task "${task.itemDescription}" has an error.`,
							message:
								task.itemRecordTypeName === 'Apex Cleanup Item'
									? 'Please check the Apex class name and make sure it implements the DemoCleanupApexItem interface.'
									: 'Please check the object API name and WHERE clause expression for any bad syntax.',
							variant: 'error',
							mode: 'sticky'
						})
					);
			});
		} else if (error) {
			this.dispatchEvent(
				new ShowToastEvent({
					mode: 'sticky',
					variant: 'error',
					title: 'Error occurred trying to retrieve Demo Cleanup Tasks',
					message: `${JSON.stringify(error)}`
				})
			);
		}
	}

	handleSelectAll(event) {
		this.cleanupTasks.forEach((task) => (task.itemSelected = true));
		this.buildSelectedRowList();
		this.calculateSelectedTotals();
	}
	handleDeselectAll(event) {
		this.cleanupTasks.forEach((task) => (task.itemSelected = false));
		this.buildSelectedRowList();
		this.calculateSelectedTotals();
	}

	showModal(event) {
		this.modalVisible = true;
	}

	handleCancelButton(event) {
		this.modalVisible = false;
		this.selectionsAndCleanupAllowed = true;
		this.dispatchEvent(
			new ShowToastEvent({
				variant: 'info',
				message: 'No Demo Cleanup Tasks were executed.'
			})
		);
	}

	handleCleanupButton(event) {
		this.modalVisible = false;
		this.selectionsAndCleanupAllowed = false;
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
				this.showErrorToast(error, 'Could not begin demo cleanup process.');
			});
	}

	handleHelpButton(event) {
		this.helpSectionVisible = !this.helpSectionVisible;
	}

	handleGoToDemoCleanupTasksButton(event) {
		this[NavigationMixin.Navigate](this.cleanupTaskListViewSpec);
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
						cleanupTask.itemRunningTotal = event.data.payload.Total_Records_Deleted__c;
						cleanupTask.itemRemaining = null;
						cleanupTask.itemPercentage = 100;
						break;
					case 'Flow Cleanup Item':
						cleanupTask.itemRunningTotal = event.data.payload.Total_Records_Deleted__c;
						cleanupTask.itemRemaining = null;
						cleanupTask.itemPercentage = 100;
						break;
				}
				if (event.data.payload.Error_JSON_String__c)
					JSON.parse(event.data.payload.Error_JSON_String__c).forEach((error) => {
						this.errorList.push(error);
					});
				cleanupTask.itemInProgress = !cleanupTask.itemDeletionFinished;
				cleanupTask.itemShowProgress = cleanupTask.itemInProgress || cleanupTask.itemHasErrors;
				if (cleanupTask.itemDeletionFinished) {
					cleanupTask.itemCompletionIcon = cleanupTask.itemHasErrors ? 'utility:error' : 'utility:success';
					cleanupTask.itemCompletionIconVariant = cleanupTask.itemHasErrors ? 'error' : 'success';
				} else {
					cleanupTask.itemCompletionIcon = 'utility:threedots';
					cleanupTask.itemCompletionIconVariant = cleanupTask.itemHasErrors ? 'error' : 'success';
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

	showErrorToast(error, title) {
		let message = 'Unknown error';
		if (Array.isArray(error.body)) message = error.body.map((err) => err.message).join(', ');
		else if (typeof error.body.message === 'string') message = error.body.message;
		this.dispatchEvent(
			new ShowToastEvent({
				mode: 'sticky',
				variant: 'error',
				title: title,
				message: message
			})
		);
	}

	handleRowSelection(event) {
		let index = this.cleanupTasks.findIndex((task) => task.itemId === event.target.getAttribute('data-id'));
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
				case 'Apex Cleanup Item':
					this.totalApexItemsSelected++;
					if (item.itemCount !== undefined && item.itemCount !== null) {
						this.totalRecordsSelected += item.itemCount;
						this.totalPermanentRecordsSelected += item.itemPermanentlyDelete ? item.itemCount : 0;
						this.totalRecycleRecordsSelected += item.itemPermanentlyDelete ? 0 : item.itemCount;
					}
					break;
				case 'Flow Cleanup Item':
					this.totalFlowItemsSelected++;
					break;
				case 'SOQL Cleanup Item':
					if (item.itemCount !== 0) {
						this.totalSoqlItemsSelected++;
						this.totalRecordsSelected += item.itemCount;
						this.totalPermanentRecordsSelected += item.itemPermanentlyDelete ? item.itemCount : 0;
						this.totalRecycleRecordsSelected += item.itemPermanentlyDelete ? 0 : item.itemCount;
					}
					break;
			}
		});
	}

	buildSelectedRowList() {
		this.selectedRows = [];
		this.template.querySelectorAll('.checkbox').forEach((row) => {
			let task = this.cleanupTasks.find((item) => item.itemId === row.getAttribute('data-id'));
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
		let targetelem = event.target;
		while (targetelem.nodeName !== 'TR') targetelem = targetelem.parentNode;

		if (this.isbefore(this.dragSource, targetelem)) targetelem.parentNode.insertBefore(this.dragSource, targetelem);
		else targetelem.parentNode.insertBefore(this.dragSource, targetelem.nextSibling);
	}

	handleDragStart(event) {
		this.dragSource = event.target;
		event.dataTransfer.effectAllowed = 'move';
		this.dragSource.classList.add('dragging');
		this.dragSource.classList.add('slds-drop-zone');
		this.dragSource.classList.add('slds-theme_shade');
	}

	handleDragEnd(event) {
		this.dragSource.classList.remove('dragging');
		this.dragSource.classList.remove('slds-drop-zone');
		this.dragSource.classList.remove('slds-theme_shade');
		this.updateOrderFromUI();
	}

	handleDragOver(event) {
		event.preventDefault();
	}

	updateOrderFromUI() {
		// Get the rows from the table in the UI and record their order in the cleanupTasks array. Then sort the array by order.
		let rows = this.template.querySelector('table').rows;
		for (let rowNumber = 0; rowNumber < rows.length; rowNumber++) {
			let id = rows.item(rowNumber).getAttribute('data-id');
			let taskIndex = this.cleanupTasks.findIndex((task) => task.itemId === id);
			this.cleanupTasks[taskIndex].itemOrder = rowNumber;
		}
		this.cleanupTasks.sort((a, b) => a.itemOrder - b.itemOrder);

		//  Create a list of JSON strings of the form "id":"order" to pass into the Apex routine that saves the new order
		//  in the database.
		let orderMapItems = [];
		this.cleanupTasks.forEach((task) => orderMapItems.push(`"${task.itemId}":"${task.itemOrder}"`));

		//  Save the new order of demo cleanup tasks in the database.
		saveOrderedTasks({ orderedMapJSON: '{' + orderMapItems.join() + '}' }).catch((error) => {
			this.showErrorToast(error, 'Error saving new Demo Cleanup Task order');
		});
	}
}
