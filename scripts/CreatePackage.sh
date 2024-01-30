#!/bin/bash
#
#  Creates a new package in the dev hub.
#
#  Copyright (c) 2021-2024, Salesforce.com, Inc.
#  All rights reserved.
#  SPDX-License-Identifier: BSD-3-Clause
#  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
#
#  Contact: john.meyer@salesforce.com

readonly devHubOrgAlias="ComponentsPlayground"

sf package create \
    --package-type "Unlocked" \
    --no-namespace \
    --name "Demo Cleanup" \
    --description "This package contains code and metadata for the Salesforce Demo Cleanup Lightning component" \
    --path "force-app" \
    --target-dev-hub "$devHubOrgAlias"