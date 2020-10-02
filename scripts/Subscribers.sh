#!/bin/bash

sfdx force:data:soql:query \
    --query "SELECT InstanceName, MetadataPackageId, MetadataPackageVersionId, OrgKey, OrgStatus, OrgName, OrgType FROM PackageSubscriber WHERE InstalledStatus = 'i'" \
    --targetusername MyComponents