declare module "@salesforce/apex/DemoCleanup.getCleanupTasks" {
  export default function getCleanupTasks(): Promise<any>;
}
declare module "@salesforce/apex/DemoCleanup.demoCleanup" {
  export default function demoCleanup(param: {cleanupTaskIds: any}): Promise<any>;
}
