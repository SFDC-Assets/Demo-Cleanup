//  Generates sample records for the Demo Cleanup Lightning component.
//
//  This code is provided AS IS, with no warranty or guarantee of suitability for use.
//  Contact: john.meyer@salesforce.com

List<String> firstNames = new List<String> {
    'John', 'Omar', 'Mathieu', 'Roksolana', 'Elliot', 'Leroy', 'Richard', 'Mitch', 'John', 'Raj'
};
List<String> lastNames = new List<String> {
    'Schillaci', 'Ayoubi', 'Berthet', 'Gishta', 'Harry', 'Kelley', 'Larne', 'Lynch', 'Meyer', 'Verma'
};

List<Account> accounts = new List<Account>();
for (Integer i = 1; i <= 3000; i++)
    accounts.add(new Account (
        Name = 'Account ' + i,
        Sic = 'Test'
    ));
insert accounts;

/*
List<Shipment> shipments = new List<Shipment>();
DateTime now = DateTime.now();
for (Integer i = 0; i < 1000; i++)
    shipments.add(new Shipment (
        ShipToName = 'Test Name',
        ActualDeliveryDate = now.addDays(i)
    ));
insert shipments;
*/

List<Contact> contacts = new List<Contact>();
for (Integer i = 0; i < 3000; i++)
    contacts.add(new Contact (
        FirstName = firstNames[(Integer) ((Decimal) (Math.random() * firstNames.size())).round(System.RoundingMode.DOWN)],
        LastName = lastNames[(Integer) ((Decimal) (Math.random() * lastNames.size())).round(System.RoundingMode.DOWN)],
        AccountId = accounts[i].Id
    ));
insert contacts;
