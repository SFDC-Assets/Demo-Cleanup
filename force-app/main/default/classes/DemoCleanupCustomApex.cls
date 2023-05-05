//  Template class for executing arbitrary Apex cade as part of the DemoCleanup Lightning component.
//
//  This is distributed as an empty shell, with a simple Lightning toast message displayed. The shell illustrates how to display
//  a list of toasts for informational purposes.
//
//  If you wish to use this template, make a copy of it as any changes to this file will be overwritten in a package update.
//
//  Copyright (c) 2021-2023, salesforce.com, inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com


public without sharing class DemoCleanupCustomApex implements DemoCleanupApexItem { 

    // Executes the Apex cleanup task.
    //
    // The parameter represents:
    //    taskId: the ID of the demo cleanup task associated with this class.

    public static void execute (Id taskId) {

        //  Change anything you want in here.  Just be careful of Salesforce governor limits.
        //  Sample: post a simple message in the user's Chatter feed to show that this code was executed.

        Demo_Cleanup_Task__c task = [SELECT Description__c, Apex_Class_Name__c FROM Demo_Cleanup_Task__c WHERE Id = :taskId LIMIT 1];
        insert new FeedItem (
            ParentId = UserInfo.getUserId(),
            Body = 'Demo Cleanup Task "' + task.Description__c + '" executed the Apex class "' + task.Apex_Class_Name__c + '".'
        );

    }
}