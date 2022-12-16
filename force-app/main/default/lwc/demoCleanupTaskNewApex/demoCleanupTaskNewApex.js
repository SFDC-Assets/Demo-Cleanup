//  Javascript controller for the new Apex Cleanup Task modal for the Demo Cleanup Lightning component.
//
//  Copyright (c) 2022, salesforce.com, inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

import { LightningElement, api, wire } from 'lwc';
import getApexClassList from '@salesforce/apex/DemoCleanup.getApexClassList';
import validateApexClass from '@salesforce/apex/DemoCleanup.validateApexClass';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { createRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import DEMO_CLEANUP_TASK from '@salesforce/schema/Demo_Cleanup_Task__c';
import RECORD_TYPE_ID from '@salesforce/schema/Demo_Cleanup_Task__c.RecordTypeId';
import DESCRIPTION_FIELD from '@salesforce/schema/Demo_Cleanup_Task__c.Description__c';
import APEX_CLASS_NAME_FIELD from '@salesforce/schema/Demo_Cleanup_Task__c.Apex_Class_Name__c';
import PERMANENTLY_DELETE_FIELD from '@salesforce/schema/Demo_Cleanup_Task__c.Permanently_Delete__c';
import ACTIVE_FIELD from '@salesforce/schema/Demo_Cleanup_Task__c.Active__c';

const PERMANENTLY_DELETE_VALUE = 'permanent';
const RECYCLE_BIN_VALUE = 'recycle';

export default class DemoCleanupTaskNewApex extends NavigationMixin(LightningElement) {
	@api recordTypeId;

	recordId;
	isOpen = true;
	saveDisabled = true;
	apexClassValid = false;
	descriptionValid = false;

	get validateDisabled() {
		return !this.apexClassValid || !this.descriptionValid;
	}

	maxDescriptionChars;
	descriptionChars = 0;
	get descriptionCharsRemaining() {
		return this.maxDescriptionChars - this.descriptionChars;
	}

	apexOptions;
	deleteOptions = [
		{ label: 'Permanently delete', value: PERMANENTLY_DELETE_VALUE },
		{ label: 'Send to Recycle Bin', value: RECYCLE_BIN_VALUE }
	];

	description;
	apexClassName;
	permanentlyDelete = RECYCLE_BIN_VALUE;
	active = true;

	@wire(getObjectInfo, { objectApiName: DEMO_CLEANUP_TASK })
	wired_getObjectInfo({ data, error }) {
		if (data) {
			this.maxDescriptionChars = data.fields.Description__c.length;
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

	@wire(getApexClassList)
	wired_getApexClassList({ data, error }) {
		if (data) {
			this.apexOptions = [];
			data.forEach((apexClass) => this.apexOptions.push(apexClass));
			this.apexOptions.sort((a, b) => a.label.localeCompare(b.label));
		} else if (error)
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Could not retrieve org Apex class list.',
					message: this.errorMessage(error),
					variant: 'error',
					mode: 'sticky'
				})
			);
	}

	handleSaveButton(event) {
		let fieldsToSave = {};
		fieldsToSave[RECORD_TYPE_ID.fieldApiName] = this.recordTypeId;
		fieldsToSave[DESCRIPTION_FIELD.fieldApiName] = this.description;
		fieldsToSave[APEX_CLASS_NAME_FIELD.fieldApiName] = this.apexClassName;
		fieldsToSave[PERMANENTLY_DELETE_FIELD.fieldApiName] = this.permanentlyDelete === PERMANENTLY_DELETE_VALUE;
		fieldsToSave[ACTIVE_FIELD.fieldApiName] = this.active;
		createRecord({ fields: fieldsToSave, apiName: DEMO_CLEANUP_TASK.objectApiName })
			.then((record) => {
				this.isOpen = false;
				this.recordId = record.id;
				this.dispatchEvent(
					new ShowToastEvent({
						message: `'${this.description}' was successfully created`,
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
						title: `Could not create '${this.description}'`,
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
			type: 'standard__objectPage',
			attributes: {
				objectApiName: 'Demo_Cleanup_Task__c',
				actionName: 'list'
			},
			state: {
				filterName: 'All'
			}
		});
	}

	handleValidateButton(event) {
		validateApexClass({ apexClassName: this.apexClassName })
			.then((result) => {
				if (result) {
					this.saveDisabled = false;
					this.dispatchEvent(
						new ShowToastEvent({
							title: 'Everything checked out',
							message: 'All the validation tests passed and you can now save your Apex cleanup task.',
							variant: 'success'
						})
					);
				} else
					this.dispatchEvent(
						new ShowToastEvent({
							title: 'Your Apex cleanup task did not pass validation',
							message: 'Please check that your Apex class is active and implements the DemoCleanupApexItem interface',
							variant: 'error',
							mode: 'sticky'
						})
					);
			})
			.catch((error) => {
				this.dispatchEvent(
					new ShowToastEvent({
						title: 'Could not validate your Apex cleanup task',
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

	handleApexClassSelection(event) {
		this.saveDisabled = true;
		this.apexClassName = event.detail.value;
	}
	validateApexClassSelection(event) {
		this.apexClassValid = event.target.checkValidity();
	}

	handlePermanentlyDelete(event) {
		this.permanentlyDelete = event.detail.value;
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
