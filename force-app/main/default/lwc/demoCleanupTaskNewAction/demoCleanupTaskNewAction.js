//  Javascript controller for the new Cleanup Task modal for the Demo Cleanup Lightning component.
//
//  Copyright (c) 2022, salesforce.com, inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

import { LightningElement, api, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import DEMO_CLEANUP_TASK from '@salesforce/schema/Demo_Cleanup_Task__c';

export default class DemoCleanupTaskNewAction extends LightningElement {
	@api recordTypeId;
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

	@wire(getObjectInfo, { objectApiName: DEMO_CLEANUP_TASK })
	wired_getObjectInfo({ data, error }) {
		if (data) {
			this.recordTypeName = data.recordTypeInfos[this.recordTypeId].name;
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
