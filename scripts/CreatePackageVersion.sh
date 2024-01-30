#!/bin/bash
#
#  Creates a new package version.
#
#  Copyright (c) 2021-2024, Salesforce.com, Inc.
#  All rights reserved.
#  SPDX-License-Identifier: BSD-3-Clause
#  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
#
#  Contact: john.meyer@salesforce.com

readonly devHubOrgAlias="ComponentsPlayground"

sf package version create \
    --definition-file config/project-scratch-def.json \
    --installation-key-bypass \
    --wait 20 \
    --path "force-app" \
    --code-coverage \
    --target-dev-hub "$devHubOrgAlias"