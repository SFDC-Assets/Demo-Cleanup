declare module "@salesforce/apex/DemoCleanup.getCleanupTasks" {
  export default function getCleanupTasks(): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.saveOrderedTasks" {
  export default function saveOrderedTasks(param: {orderedMapJSON: any}): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.startCleanup" {
  export default function startCleanup(param: {cleanupTaskListJSON: any}): Promise<any>;
}
