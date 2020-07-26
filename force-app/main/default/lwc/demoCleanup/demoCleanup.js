import { LightningElement, wire, track, api } from "lwc";
import DemoCleanupIcon from "@salesforce/resourceUrl/DemoCleanupIcon";
import getCleanupTasks from "@salesforce/apex/DemoCleanup.getCleanupTasks";

export default class DemoCleanup extends LightningElement {
	@api cardTitle = "Demo Cleanup";
	iconUrl = DemoCleanupIcon + "#icon";

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

	@track cleanupTasks = [];
	selectedRows = [];
	totalRowsSelected = 0;
	get cleanupTasksEmpty() {
		return this.cleanupTasks.length === 0;
	}
	get cleanupButtonDisabled() {
		return this.totalRowsSelected === 0;
	}

	errorList = {};

	helpSectionVisible = false;
	spinnerVisible = false;

	@wire(getCleanupTasks) cleanupTasks;

	handleRowSelection(event) {
		this.selectedRows = event.detail.selectedRows;
	}

	handleCleanupButton(event) {}

	handleHelpButton(event) {
		this.helpSectionVisible = !this.helpSectionVisible;
	}
}
