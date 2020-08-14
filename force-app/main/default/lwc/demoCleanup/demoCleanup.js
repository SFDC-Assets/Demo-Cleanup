import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { subscribe, unsubscribe } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import DemoCleanupIcon from '@salesforce/resourceUrl/DemoCleanupIcon';
import getCleanupTasks from '@salesforce/apex/DemoCleanup.getCleanupTasks';
import cleanup from '@salesforce/apex/DemoCleanup.cleanup';

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
			label: 'Permanently Delete',
			fieldName: 'itemPermanentlyDelete',
			type: 'boolean',
			initialWidth: 150,
			cellAttributes: { alignment: 'center' }
		},
		{
			label: 'Type',
			fieldName: 'itemRecordType',
			type: 'text',
			initialWidth: 100,
			cellAttributes: {
				iconName: { fieldName: 'itemRecordTypeIcon' },
				alignment: 'center'
			}
		},
		{
			label: 'Demo Cleanup Tasks',
			fieldName: 'itemLink',
			type: 'url',
			cellAttributes: {
				iconName: { fieldName: 'itemIcon' },
				alignment: 'left'
			},
			typeAttributes: {
				label: { fieldName: 'itemDescription' },
				tooltip: { fieldName: 'itemDescription' },
				target: '_parent'
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
	iconUrl = DemoCleanupIcon + '#icon';

	@track cleanupTasks = [];
	@track selectedRows = [];
	@track errorList = [];

	totalRecords = 0;
	totalPermanent = 0;
	totalRecycle = 0;
	totalSoql = 0;
	totalApex = 0;

	get cleanupTasksEmpty() {
		return this.cleanupTasks.length === 0;
	}
	maximumCleanupTasks = 90;
	get tooManyCleanupTasks() {
		return this.cleanupTasks.length > this.maximumCleanupTasks;
	}
	get cleanupButtonDisabled() {
		return this.totalSoql === 0 && this.totalApex === 0;
	}

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
		if (data) {
			data.forEach((ct) => {
				this.cleanupTasks.push({
					itemId: ct.itemId,
					itemOrder: ct.itemOrder,
					itemRecordType: ct.itemRecordTypeName === 'Apex Cleanup Item' ? 'Apex' : 'SOQL',
					itemRecordTypeIcon: ct.itemRecordTypeName === 'Apex Cleanup Item' ? 'utility:apex' : 'utility:sobject',
					itemObjectApiName: ct.itemObjectApiName,
					itemLabelPlural: ct.itemLabelPlural,
					itemWhereClause: ct.itemWhereClause === undefined ? null : ct.itemWhereClause,
					itemDescription: ct.itemDescription,
					itemPermanentlyDelete: ct.itemPermanentlyDelete,
					itemIcon: ct.itemPermanentlyDelete ? 'utility:delete' : 'utility:recycle_bin_empty',
					itemCount: ct.itemCount,
					itemQueryError: ct.itemQueryError,
					itemLink: '/lightning/r/Demo_Cleanup_Task__c/' + ct.itemId + '/view',
					itemRunningTotal: 0,
					itemRemaining: ct.itemCount,
					itemPercentage: 0,
					itemNumberOfErrors: 0,
					itemDeletionFinished: false
				});
				if (ct.itemQueryError)
					this.dispatchEvent(
						new ShowToastEvent({
							title: `Cleanup task "${ct.itemDescription}" has an error.`,
							message:
								ct.itemRecordType === 'Apex Cleanup Item'
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
		this.totalRecords = 0;
		this.totalPermanent = 0;
		this.totalRecycle = 0;
		this.totalSoql = 0;
		this.totalApex = 0;
		event.detail.selectedRows.forEach((row) => {
			if (!row.itemQueryError) {
				if (row.itemRecordType === 'Apex') {
					this.selectedRows.push(row);
					this.totalApex++;
					this.totalRecords += row.itemCount;
					this.totalPermanent += row.itemPermanentlyDelete ? row.itemCount : 0;
					this.totalRecycle += row.itemPermanentlyDelete ? 0 : row.itemCount;
				} else if (row.itemCount !== 0) {
					this.selectedRows.push(row);
					this.totalSoql++;
					this.totalRecords += row.itemCount;
					this.totalPermanent += row.itemPermanentlyDelete ? row.itemCount : 0;
					this.totalRecycle += row.itemPermanentlyDelete ? 0 : row.itemCount;
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
			cleanup({
				objectApiName: item.itemObjectApiName,
				whereClause: item.itemWhereClause,
				permanentlyDelete: item.itemPermanentlyDelete
			}).catch((error) => {
				this.dispatchEvent(
					new ShowToastEvent({
						mode: 'sticky',
						variant: 'error',
						title: `Error occurred trying to execute "${item.itemDescription}"`,
						message: `${JSON.stringify(error)}`
					})
				);
			});
		});
	}

	handleHelpButton(event) {
		this.helpSectionVisible = !this.helpSectionVisible;
	}

	handleBatchEvent(event) {
		let deletionFinished = true;
		let deletionHadErrors = false;
		this.selectedRows.forEach((cleanupTask) => {
			if (cleanupTask.itemObjectApiName === event.data.payload.Object_API_Name__c) {
				cleanupTask.itemRunningTotal = event.data.payload.Total_Records_Deleted__c;
				cleanupTask.itemRemaining = cleanupTask.itemCount - cleanupTask.itemRunningTotal;
				cleanupTask.itemPercentage = Math.round((100 * cleanupTask.itemRunningTotal) / cleanupTask.itemCount);
				cleanupTask.itemNumberOfErrors = event.data.payload.Total_Errors__c;
				cleanupTask.itemDeletionFinished = cleanupTask.itemRunningTotal >= cleanupTask.itemCount;
			}
			deletionFinished = deletionFinished && cleanupTask.itemDeletionFinished;
			deletionHadErrors = deletionHadErrors || cleanupTask.itemNumberOfErrors > 0;
		});
		this.deletionFinished = deletionFinished;
		this.deletionHadErrors = deletionHadErrors;
		JSON.parse(event.data.payload.Error_JSON_String__c).forEach((error) => {
			this.errorList.push(error);
		});
		if (deletionFinished) {
			unsubscribe(this.subscription, () => {
				this.subscription = {};
			});
		}
	}
}
