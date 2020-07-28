declare module "@salesforce/apex/DemoCleanup.getCleanupTasks" {
  export default function getCleanupTasks(): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.cleanup" {
  export default function cleanup(param: {objectApiName: any, whereClause: any, permanentlyDelete: any}): Promise<any>;
}
