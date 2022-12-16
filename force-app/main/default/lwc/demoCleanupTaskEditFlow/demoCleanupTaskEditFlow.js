//  Javascript controller for the edit Flow Cleanup Task modal for the Demo Cleanup Lightning component.
//
//  Copyright (c) 2022, salesforce.com, inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

import { LightningElement, api, wire } from 'lwc';
import validateFlow from '@salesforce/apex/DemoCleanup.validateFlow';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getFieldValue, getRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import DEMO_CLEANUP_TASK from '@salesforce/schema/Demo_Cleanup_Task__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Demo_Cleanup_Task__c.Description__c';
import FLOW_NAME_FIELD from '@salesforce/schema/Demo_Cleanup_Task__c.Flow_API_Name__c';
import ACTIVE_FIELD from '@salesforce/schema/Demo_Cleanup_Task__c.Active__c';

export default class DemoCleanupTaskEditFlow extends NavigationMixin(LightningElement) {
	@api recordId;

	isOpen = true;
	saveDisabled = true;
	flowValid = true;
	descriptionValid = true;

	get validateDisabled() {
		return !this.flowValid || !this.descriptionValid;
	}

	maxDescriptionChars;
	descriptionChars = 0;
	get descriptionCharsRemaining() {
		return this.maxDescriptionChars - this.descriptionChars;
	}

	description;
	flowApiName;
	active = true;

	@wire(getObjectInfo, { objectApiName: DEMO_CLEANUP_TASK })
	wired_getObjectInfo({ data, error }) {
		if (data) {
			this.maxDescriptionChars = getFieldValue(data, DESCRIPTION_FIELD).length;
		} else if (error)
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Could not retrieve object information.',
					message: this.errorMessage(error),
					variant: 'error',
					mode: 'sticky'
				})
			);
	}

	@wire(getRecord, {
		recordId: '$recordId',
		fields: [DESCRIPTION_FIELD, FLOW_NAME_FIELD, ACTIVE_FIELD]
	})
	wired_getRecord({ data, error }) {
		if (data) {
			this.description = getFieldValue(data, DESCRIPTION_FIELD);
			this.descriptionChars = this.description.length;
			this.flowApiName = getFieldValue(data, FLOW_NAME_FIELD);
			this.active = getFieldValue(data, ACTIVE_FIELD);
		} else if (error) {
			this.isOpen = false;
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Could not retrieve the record',
					message: this.errorMessage(error),
					variant: 'error',
					mode: 'sticky'
				})
			);
			this[NavigationMixin.Navigate]({
				type: 'standard__recordPage',
				attributes: {
					recordId: this.recordId,
					actionName: 'view'
				}
			});
		}
	}

	handleUpdateButton(event) {
		let fieldsToSave = {};
		fieldsToSave[DESCRIPTION_FIELD.fieldApiName] = this.description;
		fieldsToSave[FLOW_NAME_FIELD.fieldApiName] = this.flowApiName;
		fieldsToSave[ACTIVE_FIELD.fieldApiName] = this.active;
		fieldsToSave[ID_FIELD.fieldApiName] = this.recordId;
		updateRecord({ fields: fieldsToSave })
			.then((record) => {
				this.isOpen = false;
				this.recordId = record.id;
				this.dispatchEvent(
					new ShowToastEvent({
						message: `'${this.description}' was successfully updated`,
						variant: 'success'
					})
				);
				this[NavigationMixin.Navigate]({
					type: 'standard__recordPage',
					attributes: {
						recordId: this.recordId,
						actionName: 'view'
					}
				});
			})
			.catch((error) => {
				this.dispatchEvent(
					new ShowToastEvent({
						title: `Could not update '${this.description}'`,
						message: this.errorMessage(error),
						variant: 'error',
						mode: 'sticky'
					})
				);
			});
	}

	handleCloseButton(event) {
		this.isOpen = false;
		this[NavigationMixin.Navigate]({
			type: 'standard__recordPage',
			attributes: {
				recordId: this.recordId,
				actionName: 'view'
			}
		});
	}

	handleValidateButton(event) {
		validateFlow({ flowApiName: this.flowApiName, taskRecordId: this.recordId })
			.then((result) => {
				if (result) {
					this.saveDisabled = false;
					this.dispatchEvent(
						new ShowToastEvent({
							title: 'Everything checked out',
							message: 'All the validation tests passed and you can now save your Flow cleanup task.',
							variant: 'success'
						})
					);
				} else {
					this.saveDisabled = true;
					this.dispatchEvent(
						new ShowToastEvent({
							title: 'Your Flow cleanup task did not pass validation',
							message:
								'Please check that the API name is correct, that your flow is active, and that it is an autolaunched flow.',
							variant: 'error',
							mode: 'sticky'
						})
					);
				}
			})
			.catch((error) => {
				this.dispatchEvent(
					new ShowToastEvent({
						title: 'Could not validate your Flow cleanup task',
						message: this.errorMessage(error),
						variant: 'error',
						mode: 'sticky'
					})
				);
			});
	}

	handleDescription(event) {
		this.description = event.detail.value;
		this.descriptionChars = event.detail.value.length;
	}
	validateDescription(event) {
		this.descriptionValid = event.target.checkValidity();
	}

	handleFlowSelection(event) {
		this.saveDisabled = true;
		this.flowApiName = event.detail.value;
	}
	validateFlowSelection(event) {
		this.flowValid = event.target.checkValidity();
	}

	handleActive(event) {
		this.active = event.detail.checked;
	}

	errorMessage(error) {
		let message;
		if (Array.isArray(error.body)) message = error.body.map((err) => err.message).join(', ');
		else if (typeof error.body.message === 'string') message = error.body.message;
		else message = JSON.stringify(error);
		return message;
	}
}
