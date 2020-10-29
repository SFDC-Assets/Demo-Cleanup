declare module "@salesforce/apex/DemoCleanup.getCleanupTasks" {
  export default function getCleanupTasks(): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.cleanup" {
  export default function cleanup(param: {taskId: any, objectApiName: any, nameField: any, whereClause: any, permanentlyDelete: any}): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.executeApex" {
  export default function executeApex(param: {taskId: any, description: any, apexClassName: any, permanentlyDelete: any}): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.runFlow" {
  export default function runFlow(param: {taskId: any, description: any, flowApiName: any}): Promise<any>;
}
