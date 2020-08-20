//  Javascript controller for the Demo Cleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { subscribe, unsubscribe } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCleanupTasks from '@salesforce/apex/DemoCleanup.getCleanupTasks';
import cleanup from '@salesforce/apex/DemoCleanup.cleanup';
import executeApex from '@salesforce/apex/DemoCleanup.executeApex';

export default class DemoCleanup extends NavigationMixin(LightningElement) {
	cleanupTasksColumns = [
		{
			label: 'Records',
			fieldName: 'itemCount',
			type: 'number',
			initialWidth: 100,
			cellAttributes: { alignment: 'right' }
		},
		{
			label: 'Permanence',
			type: 'button-icon',
			initialWidth: 100,
			typeAttributes: {
				iconName: { fieldName: 'itemIcon' },
				variant: 'bare',
				class: 'slds-icon_large',
				iconClass: { fieldName: 'itemIconColor' },
				title: { fieldName: 'itemIconTooltip' }
			},
			cellAttributes: { alignment: 'center' }
		},
		{
			label: 'Type',
			fieldName: 'itemRecordType',
			type: 'text',
			initialWidth: 100,
			cellAttributes: { alignment: 'center' }
		},
		{
			label: 'Demo Cleanup Tasks',
			fieldName: 'itemLink',
			type: 'url',
			cellAttributes: { alignment: 'left' },
			typeAttributes: {
				label: { fieldName: 'itemDescription' },
				tooltip: { fieldName: 'itemDescription' },
				target: '_blank'
			}
		}
	];
	errorListColumns = [
		{
			label: 'Record',
			fieldName: 'link',
			type: 'url',
			initialWidth: 200,
			iconName: 'standard:record',
			cellAttributes: {
				alignment: 'left',
				iconName: 'utility:new_window',
				iconAlternativeText: 'Go To Record'
			},
			typeAttributes: {
				label: { fieldName: 'name' },
				tooltip: { fieldName: 'id' },
				target: '_parent'
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

	totalSoqlItemsRetrieved = 0;
	totalRecordsSelected = 0;
	totalPermanentRecordsSelected = 0;
	totalRecycleRecordsSelected = 0;
	totalSoqlItemsSelected = 0;
	totalApexItemsSelected = 0;

	get cleanupTasksEmpty() {
		return this.cleanupTasks.length === 0;
	}
	maximumCleanupTasks = 90;
	get tooManyCleanupTasks() {
		return this.totalSoqlItemsRetrieved > this.maximumCleanupTasks;
	}
	get cleanupButtonDisabled() {
		return this.totalSoqlItemsSelected === 0 && this.totalApexItemsSelected === 0;
	}

	subscription = {};

	helpSectionVisible = false;
	spinnerVisible = false;
	modalVisible = false;
	errorListVisible = false;

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

	error;

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
					itemRecordType: task.itemRecordTypeName === 'Apex Cleanup Item' ? 'Apex' : 'SOQL',
					itemApexClassName: task.itemApexClassName,
					itemObjectApiName: task.itemObjectApiName,
					itemWhereClause: task.itemWhereClause === undefined ? null : task.itemWhereClause,
					itemDescription: task.itemDescription,
					itemPermanentlyDelete: task.itemPermanentlyDelete,
					itemIcon:
						task.itemRecordTypeName === 'Apex Cleanup Item'
							? 'utility:apex'
							: task.itemPermanentlyDelete
							? 'utility:delete'
							: 'utility:recycle_bin_empty',
					itemIconColor: task.itemPermanentlyDelete ? 'slds-icon-text-error' : 'slds-icon-text-success',
					itemIconTooltip: task.itemPermanentlyDelete
						? 'Records will be permanently deleted'
						: 'Deleted records will be kept in recycle bin',
					itemCount: task.itemCount,
					itemQueryError: task.itemQueryError,
					itemLink: '/lightning/r/Demo_Cleanup_Task__c/' + task.itemId + '/view',
					itemRunningTotal: 0,
					itemRemaining: task.itemCount,
					itemPercentage: 0,
					itemNumberOfErrors: 0,
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

	handleRowSelection(event) {
		this.selectedRows = [];
		this.totalRecordsSelected = 0;
		this.totalPermanentRecordsSelected = 0;
		this.totalRecycleRecordsSelected = 0;
		this.totalSoqlItemsSelected = 0;
		this.totalApexItemsSelected = 0;
		event.detail.selectedRows.forEach((item) => {
			if (!item.itemQueryError) {
				if (item.itemRecordType === 'Apex') {
					this.selectedRows.push(item);
					this.totalApexItemsSelected++;
					if (item.itemCount !== undefined && item.itemCount !== null) {
						this.totalRecordsSelected += item.itemCount;
						this.totalPermanentRecordsSelected += item.itemPermanentlyDelete ? item.itemCount : 0;
						this.totalRecycleRecordsSelected += item.itemPermanentlyDelete ? 0 : item.itemCount;
					}
				} else if (item.itemCount !== 0) {
					this.selectedRows.push(item);
					this.totalSoqlItemsSelected++;
					this.totalRecordsSelected += item.itemCount;
					this.totalPermanentRecordsSelected += item.itemPermanentlyDelete ? item.itemCount : 0;
					this.totalRecycleRecordsSelected += item.itemPermanentlyDelete ? 0 : item.itemCount;
				}
			}
		});
	}

	showModal(event) {
		this.modalVisible = true;
	}

	handleCancelButton(event) {
		this.modalVisible = false;
	}

	handleCleanupButton(event) {
		this.modalVisible = false;
		this.deletionInProgress = true;
		subscribe('/event/Demo_Cleanup_Event__e', -1, this.handleBatchEvent.bind(this)).then((result) => {
			this.subscription = result;
		});
		this.selectedRows.forEach((item) => {
			switch (item.itemRecordType) {
				case 'SOQL':
					cleanup({
						taskId: item.itemId,
						objectApiName: item.itemObjectApiName,
						whereClause: item.itemWhereClause,
						permanentlyDelete: item.itemPermanentlyDelete
					}).catch((error) => {
						this.showErrorToast(error, `Error occurred trying to execute "${item.itemDescription}"`);
					});
					break;
				case 'Apex':
					executeApex({
						taskId: item.itemId,
						apexClassName: item.itemApexClassName,
						permanentlyDelete: item.itemPermanentlyDelete
					})
						.then((result) => {
							result.forEach((toast) => {
								this.dispatchEvent(
									new ShowToastEvent({
										mode: toast.toastMode,
										variant: toast.toastVariant,
										message: toast.toastMessage
									})
								);
							});
						})
						.catch((error) => {
							this.showErrorToast(error, `Error occurred trying to execute "${item.itemDescription}"`);
						});
					break;
			}
		});
	}

	handleHelpButton(event) {
		this.helpSectionVisible = !this.helpSectionVisible;
	}

	handleGoToDemoCleanupTasksButton(event) {
		this[NavigationMixin.Navigate](this.cleanupTaskListViewSpec);
	}

	handleBatchEvent(event) {
		let deletionFinished = true;
		let deletionHadErrors = false;
		this.selectedRows.forEach((cleanupTask) => {
			if (cleanupTask.itemId === event.data.payload.Task_Id__c) {
				switch (cleanupTask.itemRecordType) {
					case 'SOQL':
						cleanupTask.itemRunningTotal = event.data.payload.Total_Records_Deleted__c;
						cleanupTask.itemRemaining = cleanupTask.itemCount - cleanupTask.itemRunningTotal;
						if (event.data.payload.Error_JSON_String__c)
							JSON.parse(event.data.payload.Error_JSON_String__c).forEach((error) => {
								this.errorList.push(error);
							});
						break;
					case 'Apex':
						break;
				}
				cleanupTask.itemDeletionFinished = event.data.payload.Finished__c;
				cleanupTask.itemPercentage = cleanupTask.itemDeletionFinished
					? 100
					: Math.round((100 * cleanupTask.itemRunningTotal) / cleanupTask.itemCount);
				cleanupTask.itemNumberOfErrors = event.data.payload.Total_Errors__c;
				cleanupTask.itemDeletionFinished = event.data.payload.Finished__c;
			}
			deletionFinished = deletionFinished && cleanupTask.itemDeletionFinished;
			deletionHadErrors = deletionHadErrors || cleanupTask.itemNumberOfErrors > 0;
		});
		this.deletionFinished = deletionFinished;
		this.deletionHadErrors = deletionHadErrors;
		if (this.deletionFinished) {
			this.errorListVisible = this.deletionHadErrors;
			unsubscribe(this.subscription, () => {
				this.subscription = {};
			});
		}
	}

	showErrorToast(error, title) {
		this.error = 'Unknown error';
		if (Array.isArray(error.body)) this.error = error.body.map((err) => err.message).join(', ');
		else if (typeof error.body.message === 'string') this.error = error.body.message;
		this.dispatchEvent(
			new ShowToastEvent({
				mode: 'sticky',
				variant: 'error',
				title: title,
				message: this.error
			})
		);
	}
}
