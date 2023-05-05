#!/bin/bash
#
#  Creates a new package in the dev hub.
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

sfdx package create \
    --package-type "Unlocked" \
    --no-namespace \
    --name "Demo Cleanup" \
    --description "This package contains code and metadata for the Salesforce Demo Cleanup Lightning component" \
    --path "force-app" \
    --target-dev-hub "$devHubOrgAlias"