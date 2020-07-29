import { LightningElement, wire, track, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { subscribe, unsubscribe } from "lightning/empApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import DemoCleanupIcon from "@salesforce/resourceUrl/DemoCleanupIcon";
import getCleanupTasks from "@salesforce/apex/DemoCleanup.getCleanupTasks";
import runCustomApex from "@salesforce/apex/DemoCleanupCustomApex.runCustomApex";
import cleanup from "@salesforce/apex/DemoCleanup.cleanup";

export default class DemoCleanup extends NavigationMixin(LightningElement) {
	cleanupTasksColumns = [
		{
			label: "Records",
			fieldName: "itemCount",
			type: "number",
			initialWidth: 100,
			cellAttributes: { alignment: "right" }
		},
		{
			label: "Permanently Delete",
			fieldName: "itemPermanentlyDelete",
			type: "boolean",
			initialWidth: 150,
			cellAttributes: { alignment: "center" }
		},
		{
			label: "Demo Cleanup Tasks",
			fieldName: "itemLink",
			type: "url",
			cellAttributes: {
				iconName: { fieldName: "itemIcon" },
				alignment: "left"
			},
			typeAttributes: {
				label: { fieldName: "itemDescription" },
				tooltip: { fieldName: "itemDescription" },
				target: "_parent"
			}
		}
	];
	errorListColumns = [
		{
			label: "Record",
			fieldName: "link",
			type: "url",
			initialWidth: 200,
			iconName: "standard:record",
			cellAttributes: {
				alignment: "left",
				iconName: "utility:new_window",
				iconAlternativeText: "Go To Record"
			},
			typeAttributes: {
				label: { fieldName: "name" },
				tooltip: { fieldName: "id" },
				target: "_parent"
			}
		},
		{
			label: "Problem Fields",
			fieldName: "fields",
			type: "text",
			iconName: "standard:first_non_empty",
			initialWidth: 200,
			wrapText: true,
			cellAttributes: { alignment: "left" }
		},
		{
			label: "Error Message",
			fieldName: "message",
			type: "text",
			iconName: "standard:live_chat",
			wrapText: true,
			cellAttributes: { alignment: "left" }
		}
	];

	@api cardTitle = "Demo Cleanup";
	iconUrl = DemoCleanupIcon + "#icon";

	@track cleanupTasks = [];
	@track selectedRows = [];
	totalRecords = 0;
	currentTask = 0;
	get cleanupTasksEmpty() {
		return this.cleanupTasks.length === 0;
	}
	get cleanupButtonDisabled() {
		return this.totalRecords === 0;
	}

	@track errorList = [];

	subscription = {};

	helpSectionVisible = false;
	spinnerVisible = true;
	deletionInProgress = false;
	deletionFinished = false;
	deletionHadErrors = false;

	cleanupTaskListViewURL = "";
	cleanupTaskListViewSpec = {
		type: "standard__objectPage",
		attributes: {
			objectApiName: "Demo_Cleanup_Task__c",
			actionName: "list"
		},
		state: {
			filterName: "All"
		}
	};

	connectedCallback() {
		this[NavigationMixin.GenerateUrl](this.cleanupTaskListViewSpec).then((url) => {
			this.cleanupTaskListViewURL = url;
		});
	}

	@wire(getCleanupTasks)
	wired_getCleanupTasks({ data, error }) {
		this.spinnerVisible = false;
		this.cleanupTasks = [];
		if (data) {
			switch (data.status) {
				case "SUCCESS":
					data.cleanupTasks.forEach((ct) => {
						this.cleanupTasks.push({
							itemId: ct.itemId,
							itemObjectApiName: ct.itemObjectApiName,
							itemLabelPlural: ct.itemLabelPlural,
							itemWhereClause: ct.itemWhereClause === undefined ? null : ct.itemWhereClause,
							itemDescription: ct.itemDescription,
							itemPermanentlyDelete: ct.itemPermanentlyDelete,
							itemIcon: ct.itemPermanentlyDelete ? "utility:delete" : "utility:recycle_bin_empty",
							itemCount: ct.itemCount,
							itemQueryError: ct.itemQueryError,
							itemLink: "/lightning/r/Demo_Cleanup_Task__c/" + ct.itemId + "/view",
							itemRunningTotal: 0,
							itemRemaining: ct.itemCount,
							itemPercentage: 0,
							itemNumberOfErrors: 0,
							itemDeletionFinished: false
						});
						if (ct.itemQueryError)
							this.dispatchEvent(
								new ShowToastEvent({
									message: `Item "${ct.itemDescription}" has an error. Please check the object API name and WHERE clause for any bad syntax.`,
									variant: "error",
									mode: "sticky"
								})
							);
					});
					break;
				case "EMPTY":
					break;
				case "TOO_MANY":
					break;
			}
		} else if (error) {
		}
	}

	handleRowSelection(event) {
		this.selectedRows = [];
		this.totalRecords = 0;
		event.detail.selectedRows.forEach((row) => {
			if (row.itemCount !== 0) {
				this.selectedRows.push(row);
				this.totalRecords += row.itemCount;
			}
		});
	}

	handleCleanupButton(event) {
		this.deletionInProgress = true;
		subscribe("/event/Demo_Cleanup_Event__e", -1, this.handleBatchEvent.bind(this)).then((result) => {
			this.subscription = result;
		});
		this.startDeletionTask(0);
	}

	handleHelpButton(event) {
		this.helpSectionVisible = !this.helpSectionVisible;
	}

	startDeletionTask(taskIndex) {
		let item = this.selectedRows[taskIndex];
		cleanup({
			objectApiName: item.itemObjectApiName,
			whereClause: item.itemWhereClause,
			permanentlyDelete: item.itemPermanentlyDelete
		}).catch((error) => {
			this.dispatchEvent(
				new ShowToastEvent({
					mode: "sticky",
					variant: "error",
					title: `Error occurred trying to execute "${item.itemDescription}"`,
					message: `${JSON.stringify(error)}`
				})
			);
		});
	}

	handleBatchEvent(event) {
		let cleanupTask = this.selectedRows[this.currentTask];
		cleanupTask.itemRunningTotal = event.data.payload.Total_Records_Deleted__c;
		cleanupTask.itemRemaining = cleanupTask.itemCount - cleanupTask.itemRunningTotal;
		cleanupTask.itemPercentage = Math.round((100 * cleanupTask.itemRunningTotal) / cleanupTask.itemCount);
		cleanupTask.itemNumberOfErrors = event.data.payload.Total_Errors__c;
		cleanupTask.itemDeletionFinished = cleanupTask.itemRunningTotal >= cleanupTask.itemCount;
		JSON.parse(event.data.payload.Error_JSON_String__c).forEach((error) => {
			this.errorList.push(error);
		});
		console.log(`cleanupTask: ${JSON.stringify(cleanupTask)}`);
		if (cleanupTask.itemDeletionFinished) {
			if (this.currentTask < this.selectedRows.length - 1) {
				this.currentTask++;
				this.startDeletionTask(this.currentTask);
			} else {
				unsubscribe(this.subscription, () => {
					this.subscription = {};
				});
				runCustomApex().catch((error) => {
					this.dispatchEvent(
						new ShowToastEvent({
							mode: "sticky",
							variant: "error",
							title: `Error occurred trying to run custom apex`,
							message: `${JSON.stringify(error)}`
						})
					);
				});
				this.dispatchEvent(
					new ShowToastEvent({
						variant: "info",
						message: "Deletion of records completed"
					})
				);
			}
		}
	}
}