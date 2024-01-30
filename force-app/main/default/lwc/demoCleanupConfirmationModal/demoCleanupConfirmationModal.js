//  Javascript controller for the confirmation modal of the Demo Cleanup LWC.
//
//  Copyright (c) 2021-2024, Salesforce.com, Inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';

export default class DemoCleanupConfirmationModal extends LightningModal {
	@api totalRecordsSelected;
	@api totalRecycleRecordsSelected;
	@api totalPermanentRecordsSelected;
	@api totalApexItemsSelected;
	@api totalFlowItemsSelected;

	handleCleanupButton(event) {
		this.close({
			status: 'confirm'
		});
	}

	handleCancelButton(event) {
		this.close({
			status: 'cancel'
		});
	}
}
