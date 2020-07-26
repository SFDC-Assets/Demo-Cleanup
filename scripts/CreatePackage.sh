#!/bin/bash

sfdx force:package:create \
    --packagetype "Unlocked" \
    --nonamespace \
    --name "Demo Cleanup" \
    --description "This package contains code and metadata for the Salesforce Demo Cleanup Lightning component" \
    --path "force-app" \
    --targetdevhubusername "MyComponents"