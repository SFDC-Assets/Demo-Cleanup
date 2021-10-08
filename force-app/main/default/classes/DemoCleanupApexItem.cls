//  Interface describing the Apex cleanup task for the Demo Cleanup Lightning component.
//  
//  Copyright (c) 2021, salesforce.com, inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

//  Refer to the DemoCleanupCustomApex class for more information and a template for creating your own
//  custom Apex classes that work with the DemoCleanup framework.

public interface DemoCleanupApexItem {

    // Executes the Apex cleanup task.
    //
    // The parameter represents:
    //    taskId: the ID of the demo cleanup task associated with this class.

    void execute (Id taskId);
}
