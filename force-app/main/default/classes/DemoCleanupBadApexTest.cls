/**
 *  Apex class that throws an exception as part of the DemoCleanup Lightning component test suite.
 *
 *  Copyright (c) 2021-2024, Salesforce.com, Inc.
 *  All rights reserved.
 *  SPDX-License-Identifier: BSD-3-Clause
 *  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 *  @author john.meyer@salesforce.com
 *  @see    <a href="https://github.com/SFDC-Assets/Demo-Cleanup">Demo Cleanup documentation</a>
 */

@isTest
public without sharing class DemoCleanupBadApexTest implements DemoCleanupApexItem {

    public class DemoCleanupException extends Exception {}

    public static void execute (Id taskId) {
        if (taskId != null) {
            throw new DemoCleanupException('Throwing a DemoCleanupException');
        }
    }
}