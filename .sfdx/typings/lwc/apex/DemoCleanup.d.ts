declare module "@salesforce/apex/DemoCleanup.getCleanupTasks" {
  export default function getCleanupTasks(param: {allowReusedObjects: any}): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.validateSoql" {
  export default function validateSoql(param: {allowReusedObjects: any, objectApiName: any, whereClause: any}): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.validateApexClass" {
  export default function validateApexClass(param: {apexClassName: any}): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.validateFlow" {
  export default function validateFlow(param: {flowApiName: any, taskId: any}): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.saveOrderedTasks" {
  export default function saveOrderedTasks(param: {orderedMapJSON: any}): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.startCleanup" {
  export default function startCleanup(param: {cleanupTaskListJSON: any}): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.getPreviewRecords" {
  export default function getPreviewRecords(param: {objectApiName: any, whereClause: any, numberOfRecords: any, offset: any}): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.getOrgObjectList" {
  export default function getOrgObjectList(): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.getApexClassList" {
  export default function getApexClassList(): Promise<any>;
}
