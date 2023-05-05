//  Apex class that throws an exception as part of the DemoCleanup Lightning component test suite.
//
//  Copyright (c) 2021-2023, salesforce.com, inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

@SuppressWarnings('PMD.IfStmtsMustUseBraces')
@isTest
public without sharing class DemoCleanupBadApexTest implements DemoCleanupApexItem {

    public class DemoCleanupException extends Exception {}

    public static void execute (Id taskId) {
        if (taskId != null)
            throw new DemoCleanupException ('Throwing a DemoCleanupException');
    }
}