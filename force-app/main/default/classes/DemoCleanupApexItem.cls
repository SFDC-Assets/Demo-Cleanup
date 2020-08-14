public interface DemoCleanupApexItem {
    Integer getRowCount ();
    List<DemoCleanup.Toast> execute (Boolean permanentlyDelete);
}
