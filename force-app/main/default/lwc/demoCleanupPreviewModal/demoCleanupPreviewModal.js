//  Javascript controller for the preview modal of the Demo Cleanup LWC.
//
//  Copyright (c) 2021-2024, Salesforce.com, Inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import getPreviewRecords from '@salesforce/apex/DemoCleanup.getPreviewRecords';

const NUMBER_OF_PREVIEW_RECORDS = 50;

export default class DemoCleanupPreviewModal extends LightningModal {
    @api cleanupTask;
	@track previewList = [];
	previewTotalRows;
	previewTooManyRows;
	previewObjectApiName;
	previewWhereClause;
	previewOffset;
	previewLastOffset = 0;
	previewTaskLink;
	previewTaskDescription;
	previewListColumns = [
		{
			label: 'Record',
			fieldName: 'itemLink',
			type: 'url',
			wrapText: false,
			cellAttributes: { alignment: 'left' },
			typeAttributes: {
				label: { fieldName: 'itemName' },
				tooltip: { fieldName: 'itemName' },
				target: '_blank'
			}
		},
		{
			label: 'Owner',
			fieldName: 'itemOwnerLink',
			type: 'url',
			wrapText: false,
			cellAttributes: { alignment: 'left' },
			typeAttributes: {
				label: { fieldName: 'itemOwnerName' },
				tooltip: { fieldName: 'itemOwnerName' },
				target: '_blank'
			}
		},
		{
			label: 'Created',
			fieldName: 'itemCreatedDate',
			type: 'date',
			wrapText: false,
			cellAttributes: { alignment: 'center' },
			typeAttributes: {
				month: '2-digit',
				day: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			}
		},
		{
			label: 'Modified',
			fieldName: 'itemModifiedDate',
			type: 'date',
			wrapText: false,
			cellAttributes: { alignment: 'center' },
			typeAttributes: {
				month: '2-digit',
				day: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			}
		}
	];
	get previewRowsShowing() {
		return this.previewList.length;
	}

	connectedCallback() {
		this.previewList = [];
		this.previewOffset = 0;
		this.previewLastOffset = 0;
		this.previewTotalRows = this.cleanupTask.itemCount;
		this.previewTooManyRows = this.cleanupTask.itemCount > 2000;
		this.previewObjectApiName = this.cleanupTask.itemObjectApiName;
		this.previewWhereClause = this.cleanupTask.itemWhereClause;
		this.previewTaskLink = this.cleanupTask.itemLink;
		this.previewTaskDescription = this.cleanupTask.itemDescription;
		this.loadPreviewData();
	}

	async loadPreviewData() {
		const result = await getPreviewRecords({
			objectApiName: this.previewObjectApiName,
			whereClause: this.previewWhereClause,
			numberOfRecords: NUMBER_OF_PREVIEW_RECORDS,
			offset: this.previewOffset
		});
		let newRecords = [];
		result.forEach((record) => {
			newRecords.push({
				itemId: record.itemId,
				itemName: record.itemName,
				itemLink: '/lightning/r/' + record.itemId + '/view',
				itemOwnerName: record.itemOwnerName,
				itemOwnerLink: record.itemOwnerId === null ? null : '/lightning/r/' + record.itemOwnerId + '/view',
				itemCreatedDate: record.itemCreatedDate,
				itemModifiedDate: record.itemModifiedDate
			});
		});
		this.previewList = [...this.previewList, ...newRecords];
	}

	handlePreviewLoadMore(event) {
		const { target } = event;
		target.isLoading = true;
		this.previewOffset += NUMBER_OF_PREVIEW_RECORDS;
		this.loadPreviewData().then(() => {
			target.isLoading = false;
			// We cannot do a SOQL query with an offset greater than 2000.
			if (this.previewList.length >= this.previewTotalRows || this.previewList.length >= 2000)
				target.enableInfiniteLoading = false;
		});
	}

	handlePreviewCancelButton(event) {
		this.close();
	}
}
