#!/bin/bash
#
#  Creates a new scratch org and populates it with sample data.
#
#  Copyright (c) 2021-2024, Salesforce.com, Inc.
#  All rights reserved.
#  SPDX-License-Identifier: BSD-3-Clause
#  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
#
#  Contact: john.meyer@salesforce.com

readonly orgAlias="Demo Cleanup Tool"
readonly devHubUserName="ComponentsPlayground"

echo "*** Creating scratch org ..."
sf org create scratch \
    --definition-file config/project-scratch-def.json \
    --no-namespace \
    --target-dev-hub "$devHubUserName" \
    --set-default \
    --alias "$orgAlias" \
    --duration-days 30 || exit 1
echo "*** Pushing metadata to scratch org ..."
sf project deploy start || exit 1
echo "*** Assigning permission sets to your user ..."
sf org assign permset --name Demo_Cleanup --name Demo_Reset_Tools_Tester
echo "*** Generating password for your user ..."
sf org generate password
echo "*** Setting time zone for your user ..."
sf data record update --sobject User --where "Name='User User'" --values "TimeZoneSidKey='America/New_York'"
echo "*** Enabling debug mode for your user  ..."
sf data record update --sobject User --where "Name='User User'" --values "UserPreferencesUserDebugModePref='true'"
echo "*** Creating sample data ..."
sf apex run --file "scripts/apex/DemoCleanupTasks.apex"
sf apex run --file "scripts/apex/SampleData.apex"