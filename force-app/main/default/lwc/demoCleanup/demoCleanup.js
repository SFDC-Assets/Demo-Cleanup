import { LightningElement, wire, track, api } from "lwc";
import DemoCleanupIcon from "@salesforce/resourceUrl/DemoCleanupIcon";
import getCleanupTasks from "@salesforce/apex/DemoCleanup.getCleanupTasks";

export default class DemoCleanup extends LightningElement {
	cleanupTasksColumns = [
		{
			label: "Records",
			fieldName: "itemCount",
			type: "number",
			initialWidth: 100,
			cellAttributes: { alignment: "right" }
		},
		{
			label: "Perm Delete",
			fieldName: "itemPermanentlyDelete",
			type: "boolean",
			initialWidth: 100,
			cellAttributes: { alignment: "center" }
		},
		{
			label: "Demo Cleanup Tasks",
			fieldName: "itemLink",
			type: "url",
			cellAttributes: {
				iconName: "standard:task",
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
	selectedRows = [];
	totalRowsSelected = 0;
	get cleanupTasksEmpty() {
		return this.cleanupTasks.length === 0;
	}
	get cleanupButtonDisabled() {
		return this.totalRowsSelected === 0;
	}

	@track errorList = [];

	helpSectionVisible = false;
	spinnerVisible = false;
	deletionInProgress = false;
	deletionFinished = false;
	deletionHadErrors = false;

	@wire(getCleanupTasks)
	wired_getCleanupTasks({ data, error }) {
		this.cleanupTasks = [];
		if (data) {
			data.forEach((ct) => {
				this.cleanupTasks.push({
					itemId: ct.itemId,
					itemObjectApiName: ct.itemObjectApiName,
					itemLabelPlural: ct.itemLabelPlural,
					itemWhereClause: ct.itemWhereClause,
					itemDescription: ct.itemDescription,
					itemPermanentlyDelete: ct.itemPermanentlyDelete,
					itemCount: ct.itemCount,
					itemQueryError: ct.itemQueryError,
					itemLink: "/lightning/r/Demo_Cleanup_Task__c/" + ct.itemId + "/view",
					itemRunningTotal: 0,
					itemRemaining: 0,
					itemPercentage: 0,
					itemNumberOfErrors: 0,
					itemDeletionFinished: false
				});
			});
		} else if (error) {
		}
	}

	handleRowSelection(event) {
		this.selectedRows = event.detail.selectedRows;
		this.totalRowsSelected = this.selectedRows.length;
	}

	handleCleanupButton(event) {}

	handleHelpButton(event) {
		this.helpSectionVisible = !this.helpSectionVisible;
	}
}
