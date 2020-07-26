#!/bin/bash

sfdx force:package:version:create \
    --installationkeybypass \
    --wait 10 \
    --package "Demo Cleanup" \
    --path "force-app" \
    --targetdevhubusername "MyComponents"