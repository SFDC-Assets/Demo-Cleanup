#!/bin/bash
#
#  Lists all of the orgs that have installed packages from this dev hub.
#
#  Copyright (c) 2021-2024, Salesforce.com, Inc.
#  All rights reserved.
#  SPDX-License-Identifier: BSD-3-Clause
#  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
#
#  Contact: john.meyer@salesforce.com

readonly devHubOrgAlias="ComponentsPlayground"

sf data query \
    --query "SELECT Id, Name, NamespacePrefix, PackageCategory FROM MetadataPackage ORDER BY Id" \
    --target-org "$devHubOrgAlias"
sf data query \
    --query "SELECT MetadataPackageId, count(Id) Installs FROM PackageSubscriber WHERE InstalledStatus = 'i' GROUP BY MetadataPackageId ORDER BY MetadataPackageId" \
    --target-org "$devHubOrgAlias"