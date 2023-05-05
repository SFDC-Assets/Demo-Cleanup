#!/bin/bash
#
#  Deletes the current scratch org.
#
#  Copyright (c) 2021-2023, salesforce.com, inc.
#  All rights reserved.
#  SPDX-License-Identifier: BSD-3-Clause
#  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
#
#  Contact: john.meyer@salesforce.com

readonly devHubOrgAlias=$(jq --raw-output .defaultdevhubusername < .sfdx/sfdx-config.json) || {
    echo "Make sure that \"jq\" is installed and that \"defaultdevhubusername\" is defined in .sfdx/sfdx-config.json." >&2
    exit 1
}
readonly tmpFile=$(jq --raw-output .defaultdevhubusername < .sfdx/sfdx-config.json) || {
    echo "Make sure that \"jq\" is installed and that \"defaultdevhubusername\" is defined in .sfdx/sfdx-config.json." >&2
    exit 1
}
readonly scratchOrgId=$(sfdx force:org:display --json | jq --raw-output .result.id | cut -c 1-15)

sfdx data query \
    --query "SELECT Id FROM ScratchOrgInfo WHERE ScratchOrg = '$scratchOrgId'" \
    --result-format csv \
    --target-org "$devHubOrgAlias" > "$tmpFile"
echo "*** Found scratch org $scratchOrgId ..."
sfdx force data bulk delete --file "$tmpFile" --sobject ScratchOrgInfo --wait 10 --target-org "$devHubOrgAlias"
rm -f "$tmpFile"