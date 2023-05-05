#!/bin/bash
#
#  Lists all of the orgs that have installed packages from this dev hub.
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

sfdx data query \
    --query "SELECT Id, Name, NamespacePrefix, PackageCategory FROM MetadataPackage ORDER BY Id" \
    --target-org "$devHubOrgAlias"
sfdx data query \
    --query "SELECT MetadataPackageId, count(Id) Installs FROM PackageSubscriber WHERE InstalledStatus = 'i' GROUP BY MetadataPackageId ORDER BY MetadataPackageId" \
    --target-org "$devHubOrgAlias"