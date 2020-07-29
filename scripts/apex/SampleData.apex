List<Account> accounts = new List<Account>();
for (Integer i = 1; i <= 2000; i++)
    accounts.add(new Account(
        Name = 'Account' + i,
        Sic = 'Test'
        ));
insert accounts;

List<Shipment> shipments = new List<Shipment>();
DateTime now = DateTime.now();
for (Integer i = 0; i < 5000; i++)
    shipments.add(new Shipment (
        ShipToName = 'Test Name',
        ActualDeliveryDate = now.addDays(i)
    ));
insert shipments;

List<Account> first2 = [SELECT Id FROM Account LIMIT 2];
insert new Opportunity (
    Name = 'Test 1',
    AccountId = first2[0].Id,
    CloseDate = Date.today(),
    StageName = 'Prospecting'
);
insert new Opportunity (
    Name = 'Test 2',
    AccountId = first2[1].Id,
    CloseDate = Date.today(),
    StageName = 'Prospecting'
);