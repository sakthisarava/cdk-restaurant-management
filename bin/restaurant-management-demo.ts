#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ExistingResources } from '../lib/existing-resources';
import { SharedStack } from '../lib/shared-stack';
import { ServiceStaffStack } from '../lib/service-staff-stack';
import { KitchenStaffStack } from '../lib/kitchen-staff-stack';
import { ManagerStack } from '../lib/manager-stack';

// App
const app = new cdk.App();

// Stack containing existing resources
const existingResources = new ExistingResources(app, `ExistingResourcesStack`);

// Stack containing shared resources across all functions
const sharedStack = new SharedStack(app, `SharedStack`);

// Stack containing resources that enable Service Staff functions
new ServiceStaffStack(app, `ServiceStaffStack`, {
  db: sharedStack.database
});

// Stack containing resources that enable Kitchen Staff functions
new KitchenStaffStack(app, `KitchenStaffStack`, {
  db: sharedStack.database
});

// Stack containing resources that enable Manager functions
new ManagerStack(app, `ManagerStack`, {
  db: sharedStack.database,
  layer: sharedStack.layer,
  archiveBucket: existingResources.archiveBucket,
});