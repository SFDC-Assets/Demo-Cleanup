/**
 *  Interface describing the Apex cleanup task for the Demo Cleanup Lightning component.
 *
 *  Copyright (c) 2021-2024, Salesforce.com, Inc.
 *  All rights reserved.
 *  SPDX-License-Identifier: BSD-3-Clause
 *  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 *  @author john.meyer@salesforce.com
 *  @see    <a href="https://github.com/SFDC-Assets/Demo-Cleanup">Demo Cleanup documentation</a>
 */

public interface DemoCleanupApexItem {

    /**
     * Executes the Apex cleanup task.
     *
     * @param taskId    the ID of the demo cleanup task associated with this class.
     */

    void execute (Id taskId);
}
