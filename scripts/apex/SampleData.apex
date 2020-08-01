List<Account> accounts = new List<Account>();
for (Integer i = 1; i <= 100; i++)
    accounts.add(new Account (
        Name = 'Account' + i,
        Sic = 'Test'
        ));
insert accounts;

List<Shipment> shipments = new List<Shipment>();
DateTime now = DateTime.now();
for (Integer i = 0; i < 1000; i++)
    shipments.add(new Shipment (
        ShipToName = 'Test Name',
        ActualDeliveryDate = now.addDays(i)
    ));
insert shipments;

List<Contact> contacts = new List<Contact>();
for (Integer i = 0; i < 100; i++)
    contacts.add(new Contact (
        FirstName = 'John',
        LastName = 'Meyer',
        AccountId = accounts[i].Id
    ));
insert contacts;
