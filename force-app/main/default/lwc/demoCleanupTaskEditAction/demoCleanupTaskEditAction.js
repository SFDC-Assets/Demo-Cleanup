//  Javascript controller for the edit Cleanup Task modal for the Demo Cleanup Lightning component.
//
//  Copyright (c) 2022, salesforce.com, inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import RECORD_TYPE_NAME from '@salesforce/schema/Demo_Cleanup_Task__c.RecordType.Name';

export default class DemoCleanupTaskEditAction extends LightningElement {
	@api recordId;
	recordTypeName;

	get isSOQL() {
		return this.recordTypeName === 'SOQL Cleanup Task';
	}
	get isApex() {
		return this.recordTypeName === 'Apex Cleanup Task';
	}
	get isFlow() {
		return this.recordTypeName === 'Flow Cleanup Task';
	}

	@wire(getRecord, { recordId: '$recordId', fields: [RECORD_TYPE_NAME] })
	wired_getRecord({ data, error }) {
		if (data) {
			this.recordTypeName = data.fields.RecordType.displayValue;
		} else if (error)
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Could not retrieve record type.',
					message: this.errorMessage(error),
					variant: 'error',
					mode: 'sticky'
				})
			);
	}

	errorMessage(error) {
		let message;
		if (Array.isArray(error.body)) message = error.body.map((err) => err.message).join(', ');
		else if (typeof error.body.message === 'string') message = error.body.message;
		else message = JSON.stringify(error);
		return message;
	}
}
