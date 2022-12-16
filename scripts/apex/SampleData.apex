//  Generates sample records for the Demo Cleanup Lightning component.
//
//  Copyright (c) 2022, salesforce.com, inc.
//  All rights reserved.
//  SPDX-License-Identifier: BSD-3-Clause
//  For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
//
//  Contact: john.meyer@salesforce.com

List<String> firstNames = new List<String> {
    'John', 'Omar', 'Mathieu', 'Roksolana', 'Elliot', 'Leroy', 'Richard', 'Mitch', 'John', 'Raj'
};
List<String> lastNames = new List<String> {
    'Schillaci', 'Ayoubi', 'Berthet', 'Gishta', 'Harry', 'Kelley', 'Larne', 'Lynch', 'Meyer', 'Verma'
};

final DateTime NOW = DateTime.now();
final Integer NUMBER_OF_RECORDS = 500;

List<Account> accounts = new List<Account>();
for (Integer i = 1; i <= NUMBER_OF_RECORDS; i++)
    accounts.add(new Account (
        Name = 'Account ' + i,
        Sic = 'Test'
    ));
insert accounts;

List<Contact> contacts = new List<Contact>();
for (Integer i = 0; i < NUMBER_OF_RECORDS; i++)
    contacts.add(new Contact (
        FirstName = firstNames[(Integer) ((Decimal) (Math.random() * firstNames.size())).round(System.RoundingMode.DOWN)],
        LastName = lastNames[(Integer) ((Decimal) (Math.random() * lastNames.size())).round(System.RoundingMode.DOWN)],
        AccountId = accounts[i].Id
    ));
insert contacts;

List<Case> cases = new List<Case>();
for (Integer i = 0; i < NUMBER_OF_RECORDS; i++)
    cases.add(new Case (
        Subject = 'Case ' + i + 1,
        ContactId = contacts[i].Id
    ));
insert cases;

List<Event> events = new List<Event>();
for (Integer i = 1; i <= NUMBER_OF_RECORDS; i++)
    events.add(new Event (
        Subject = 'Event ' + i,
        StartDateTime = NOW,
        DurationInMinutes = 30
    ));
insert events;

List<Task> tasks = new List<Task>();
for (Integer i = 1; i <= 3 * NUMBER_OF_RECORDS; i++)  
    tasks.add(new Task (
        Subject = 'Task ' + i,
        Priority = 'Normal',
        Status = 'Not Started'
    ));
insert tasks;

List<Campaign> campaigns = new List<Campaign>();
for (Integer i = 1; i <= NUMBER_OF_RECORDS; i++)
    campaigns.add(new Campaign (
        Name = 'Campaign ' + i
    ));
insert campaigns;