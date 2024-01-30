//  Javascript controller for the Demo Cleanup Lightning component.
//
//  Copyright (c) 2021-2024, Salesforce.com, Inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

import { LightningElement, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { subscribe, unsubscribe } from 'lightning/empApi';
import Toast from 'lightning/toast';
import DemoCleanupHelpModal from 'c/demoCleanupHelpModal';
import DemoCleanupPreviewModal from 'c/demoCleanupPreviewModal';
import DemoCleanupConfirmationModal from 'c/demoCleanupConfirmationModal';
import getCleanupTasks from '@salesforce/apex/DemoCleanup.getCleanupTasks';
import saveOrderedTasks from '@salesforce/apex/DemoCleanup.saveOrderedTasks';
import startCleanup from '@salesforce/apex/DemoCleanup.startCleanup';

const MAXIMUM_SOQL_CLEANUP_TASKS = 90;

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

export default class DemoCleanup extends NavigationMixin(LightningElement) {
	@api cardTitle = 'Demo Cleanup';
	@api allowReusedObjects = false;

	@track cleanupTasks = [];
	maximumSoqlCleanupTasks = MAXIMUM_SOQL_CLEANUP_TASKS;
	numberOfSoqlCleanupTasks = 0;
	get cleanupTasksPresent() {
		return !this.cleanupTaskLoadFinished || this.numberOfSoqlCleanupTasks !== 0;
	}
	get tooManySoqlCleanupTasks() {
		return this.numberOfSoqlCleanupTasks > MAXIMUM_SOQL_CLEANUP_TASKS;
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
	get selectAll() {
		return this.cleanupTasks.reduce(
			(selected, task) => selected && (task.itemCheckboxDisabled ? selected : task.itemSelected),
			true
		);
	}

	subscription;

	spinnerVisible = false;

	cleanupTaskLoadFinished = false;
	deletionInProgress = false;
	deletionFinished = false;
	deletionHadErrors = false;

	cleanupTaskListViewUrl = '';

	dragSource;
	get draggable() {
		return !this.deletionInProgress && !this.deletionFinished;
	}

	connectedCallback() {
		this[NavigationMixin.GenerateUrl](CLEANUP_TASK_LIST_VIEW_SPEC).then((url) => (this.cleanupTaskListViewUrl = url));
		this.spinnerVisible = true;
		this.initialize();
	}

	initialize() {
		this.cleanupTaskLoadFinished = false;
		this.spinnerVisible = false;
		this.cleanupTasks = [];
		this.selectedRows = [];
		this.totalRecordsSelected = 0;
		this.totalPermanentRecordsSelected = 0;
		this.totalRecycleRecordsSelected = 0;
		this.totalSoqlItemsSelected = 0;
		this.totalApexItemsSelected = 0;
		this.totalFlowItemsSelected = 0;
		getCleanupTasks({ allowReusedObjects: this.allowReusedObjects })
			.then((result) => {
				result.forEach((task) => {
					this.cleanupTasks.push({
						itemId: task.itemId,
						itemSelected: false,
						itemCheckboxDisabled: task.itemQueryError,
						itemCheckboxToolTip: `Check the box to include "${task.itemDescription}" in the cleanup run`,
						itemOrder: task.itemOrder,
						itemRecordTypeName: task.itemRecordTypeName,
						itemIsSOQL: task.itemRecordTypeName === 'SOQL Cleanup Task',
						itemShowPreviewButton:
							task.itemRecordTypeName === 'SOQL Cleanup Task' && !task.itemQueryError && task.itemCount,
						itemApexClassName: task.itemApexClassName,
						itemFlowName: task.itemFlowApiName,
						itemObjectApiName: task.itemObjectApiName,
						itemDuplicateObjectTask: task.itemDuplicateObjectTask,
						itemWhereClause: task.itemWhereClause,
						itemDescription: task.itemDescription,
						itemToolTip: `Open the "${task.itemDescription}" task record in a new tab`,
						itemPermanentlyDelete: task.itemPermanentlyDelete,
						itemIcon:
							task.itemRecordTypeName === 'Apex Cleanup Task'
								? 'utility:apex'
								: task.itemRecordTypeName === 'Flow Cleanup Task'
								? 'utility:flow'
								: 'utility:database',
						itemIconVariant: task.itemPermanentlyDelete ? 'error' : 'success',
						itemCompletionIcon: null,
						itemCompletionIconVariant: 'info',
						itemIconToolTip: task.itemPermanentlyDelete
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
						Toast.show({
							label: `Cleanup task "${task.itemDescription}" uses the same object as "${task.itemDuplicateObjectTask}"`,
							message: 'Combine the two Demo Cleanup Tasks into a single task with a unified WHERE clause.',
							variant: 'error',
							mode: 'sticky'
						});
					} else if (task.itemQueryError) {
						let message;
						switch (task.itemRecordTypeName) {
							case 'Apex Cleanup Task':
								message =
									'Please check the Apex class and make sure it exists, is active, implements the "DemoCleanupApexItem" ' +
									'interface, and that you have permission to execute it.';
								break;
							case 'Flow Cleanup Task':
								message = 'Please check the flow and make sure it exists, is active, and is an autolaunched flow.';
								break;
							case 'SOQL Cleanup Task':
								message =
									'Please check the object API name (including any "__c") and WHERE clause expression for any bad syntax.';
								break;
						}
						Toast.show({
							label: `Cleanup task "${task.itemDescription}" has an error.`,
							message: message,
							variant: 'error',
							mode: 'sticky'
						});
					}
				});
			})
			.catch((error) => {
				Toast.show({
					message: `${JSON.stringify(error)}`,
					label: 'Error occurred trying to retrieve Demo Cleanup Tasks',
					variant: 'error',
					mode: 'sticky'
				});
			})
			.finally(() => {
				this.numberOfSoqlCleanupTasks = this.cleanupTasks.reduce(
					(count, task) => count + (task.itemIsSOQL && !task.itemCheckboxDisabled ? 1 : 0),
					0
				);
				this.cleanupTaskLoadFinished = true;
			});
	}

	handleSelectAll(event) {
		this.cleanupTasks.forEach((task) => {
			task.itemCheckboxDisabled = task.itemQueryError || this.selectDisabled;
			task.itemSelected = event.target.checked ? !task.itemQueryError : false;
		});
		this.buildSelectedRowList();
		this.calculateSelectedTotals();
	}

	showConfirmationModal(event) {
		DemoCleanupConfirmationModal.open({
			size: 'small',
			description: 'Demo Cleanup Confimation Modal',
			totalRecordsSelected: this.totalRecordsSelected,
			totalRecycleRecordsSelected: this.totalRecycleRecordsSelected,
			totalPermanentRecordsSelected: this.totalPermanentRecordsSelected,
			totalApexItemsSelected: this.totalApexItemsSelected,
			totalFlowItemsSelected: this.totalFlowItemsSelected
		}).then((result) => {
			switch (result.status) {
				case 'confirm':
					this.selectionsAndCleanupAllowed = false;
					this.spinnerVisible = true;
					this.cleanupTasks.forEach((task) => {
						task.itemCheckboxDisabled = true;
					});
					this.deletionInProgress = true;
					subscribe('/event/Demo_Cleanup_Event__e', -1, this.handlePlatformEvent.bind(this)).then((result) => {
						this.subscription = result;
					});
					startCleanup({ cleanupTaskListJSON: JSON.stringify(this.selectedRows) })
						.then(() => {
							Toast.show({
								label: 'The demo cleanup process has started. PLEASE BE PATIENT.',
								message:
									'Depending on the load on the infrastructure, some items may take up to a few minutes to start. ' +
									'If you navigate away from this page, the cleanup will continue, but you will not be able to monitor the progress.',
								variant: 'info',
								mode: 'sticky'
							});
						})
						.catch((error) => {
							Toast.show({
								label: 'Could not begin demo cleanup process.',
								message: JSON.stringify(error),
								variant: 'error',
								mode: 'sticky'
							});
						});
					break;
				case 'cancel':
					this.selectionsAndCleanupAllowed = true;
					break;
			}
		});
	}

	handleHelpButton(event) {
		DemoCleanupHelpModal.open({
			size: 'small',
			description: 'Demo Cleanup help modal',
			cleanupTaskListViewUrl: this.cleanupTaskListViewUrl
		});
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
					case 'SOQL Cleanup Task':
						cleanupTask.itemRunningTotal = event.data.payload.Total_Records_Deleted__c;
						cleanupTask.itemRemaining =
							cleanupTask.itemCount - cleanupTask.itemRunningTotal + cleanupTask.itemNumberOfRecordsWithErrors;
						cleanupTask.itemPercentage = cleanupTask.itemDeletionFinished
							? 100
							: Math.round((100 * cleanupTask.itemRunningTotal) / cleanupTask.itemCount);
						break;
					case 'Apex Cleanup Task':
					case 'Flow Cleanup Task':
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
				Toast.show({
					variant: 'error',
					mode: 'sticky',
					label: 'Demo cleanup has completed but one or more tasks had errors.'
				});
			else
				Toast.show({
					variant: 'success',
					mode: 'sticky',
					label: 'Demo cleanup has completed without any errors.'
				});
			this.spinnerVisible = false;
		}
	}

	handlePreviewButton(event) {
		DemoCleanupPreviewModal.open({
			size: 'small',
			description: 'Demo Cleanup Preview',
			cleanupTask: this.cleanupTasks.find((task) => task.itemId === event.target.getAttribute('data-id'))
		});
	}

	handleRowSelection(event) {
		this.cleanupTasks.find((task) => task.itemId === event.target.getAttribute('data-id')).itemSelected = event.target.checked;
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
				case 'SOQL Cleanup Task':
					if (item.itemCount !== 0) {
						if (!item.itemQueryError) this.totalSoqlItemsSelected++;
						this.totalRecordsSelected += item.itemCount;
						this.totalPermanentRecordsSelected += item.itemPermanentlyDelete ? item.itemCount : 0;
						this.totalRecycleRecordsSelected += item.itemPermanentlyDelete ? 0 : item.itemCount;
					}
					break;
				case 'Apex Cleanup Task':
					if (!item.itemQueryError) this.totalApexItemsSelected++;
					break;
				case 'Flow Cleanup Task':
					if (!item.itemQueryError) this.totalFlowItemsSelected++;
					break;
			}
		});
	}

	buildSelectedRowList() {
		this.selectedRows = [];
		this.template.querySelectorAll('[data-type="cleanup-task-checkbox"]').forEach((row) => {
			const task = this.cleanupTasks.find((item) => item.itemId === row.getAttribute('data-id'));
			if (
				task.itemSelected &&
				!task.itemQueryError &&
				!(task.itemRecordTypeName === 'SOQL Cleanup Task' && task.itemCount === 0)
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

	handleDragStart(event) {
		this.dragSource = event.target;
		event.dataTransfer.effectAllowed = 'move';
		this.dragSource.classList.add('dragging', 'slds-drop-zone', 'slds-theme_shade');
	}

	handleDragEnter(event) {
		// Find the first <TR> node encapsulating whatever subnode we clicked on while dragging the row.
		let targetelem = event.target;
		while (targetelem.nodeName !== 'TR') targetelem = targetelem.parentNode;

		if (this.isbefore(this.dragSource, targetelem)) targetelem.parentNode.insertBefore(this.dragSource, targetelem);
		else targetelem.parentNode.insertBefore(this.dragSource, targetelem.nextSibling);
	}

	handleDragEnd(event) {
		this.dragSource.classList.remove('dragging', 'slds-drop-zone', 'slds-theme_shade');
		this.updateOrderFromUI();
	}

	updateOrderFromUI() {
		// Get the rows from the table in the UI and record their order in the cleanupTasks array. Then sort the array by order.
		let rows = this.refs.cleanupTaskTable.rows;
		// Start at row index 1 to skip the <tr> in the <thead>
		const start = 1;
		for (let rowNumber = start; rowNumber < rows.length; rowNumber++) {
			const id = rows.item(rowNumber).getAttribute('data-id');
			const taskIndex = this.cleanupTasks.findIndex((task) => task.itemId === id);
			this.cleanupTasks[taskIndex].itemOrder = rowNumber - start;
		}
		this.cleanupTasks.sort((a, b) => a.itemOrder - b.itemOrder);

		//  Save the new order of demo cleanup tasks in the database.
		let orderedMap = {};
		this.cleanupTasks.forEach((task) => {
			orderedMap[task.itemId] = task.itemOrder;
		});
		saveOrderedTasks({ orderedMapJSON: JSON.stringify(orderedMap) }).catch((error) => {
			Toast.show({
				message: JSON.stringify(error),
				label: 'Error saving new Demo Cleanup Task order',
				variant: 'error',
				mode: 'sticky'
			});
		});
	}
}
