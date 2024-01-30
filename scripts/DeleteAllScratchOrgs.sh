#!/bin/bash
#
#  Deletes all scratch orgs from the Dev Hub.
#
#  Copyright (c) 2021-2024, Salesforce.com, Inc.
#  All rights reserved.
#  SPDX-License-Identifier: BSD-3-Clause
#  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
#
#  Contact: john.meyer@salesforce.com

readonly devHubOrgAlias="ComponentsPlayground"
readonly tmpFile="/tmp/DeleteAllScratchOrgs-$$"

sf data query \
    --query "SELECT Id FROM ScratchOrgInfo" \
    --result-format csv \
    --target-org "$devHubOrgAlias" > "$tmpFile"
echo "*** Deleting all scratch orgs ..."
sf data bulk delete --file "$tmpFile" --sobject ScratchOrgInfo --wait 10 --target-org "$devHubOrgAlias"
rm -f "$tmpFile"