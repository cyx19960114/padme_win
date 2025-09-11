
const complexTypes = require('../../../models/datatypes/complexDataTypes');
const faker = require('@faker-js/faker').fakerDE;

class FakeJsPlugin {
  lookup = {};

  constructor() {

    this.lookup[complexTypes.FirstName.value.uri] = () => faker.person.firstName();
    this.lookup[complexTypes.LastName.value.uri] = () => faker.person.lastName();
    this.lookup[complexTypes.FullName.value.uri] = () => `${faker.person.firstName()} ${faker.person.lastName()}`
    this.lookup[complexTypes.JobTitle.value.uri] = () => faker.person.jobTitle();
    this.lookup[complexTypes.Email.value.uri] = () => faker.internet.email();
    this.lookup[complexTypes.BuildingNumber.value.uri] = () => faker.location.buildingNumber();
    this.lookup[complexTypes.City.value.uri] = () => faker.location.city();
    this.lookup[complexTypes.Street.value.uri] = () => faker.location.street();
    this.lookup[complexTypes.Country.value.uri] = () => faker.location.country();
    this.lookup[complexTypes.ZipCode.value.uri] = () => faker.location.zipCode('#####');
    this.lookup[complexTypes.CompanyName.value.uri] = () => faker.company.name(); //will be replaced with name() soon
    this.lookup[complexTypes.Uuid.value.uri] = () => faker.string.uuid();
    this.lookup[complexTypes.Date.value.uri] = () => faker.date.between('2000-01-01T00:00:00.000Z').toISOString();
    this.lookup[complexTypes.LoremIpsum.value.uri] = (length) => `${faker.lorem.paragraph().substring(0, length - 1).trim()}.`;
  }

  /**
   * Creates a instance of the datatype with the provided iri
   * @param {*} iri 
   * @param {*} length 
   * @returns 
   */
  createInstance(iri, length) {
    return this.lookup[iri](length);
  }
}

module.exports.info = [
  complexTypes.FirstName.value.uri,
  complexTypes.LastName.value.uri,
  complexTypes.FullName.value.uri,
  complexTypes.JobTitle.value.uri,
  complexTypes.Email.value.uri,
  complexTypes.BuildingNumber.value.uri,
  complexTypes.City.value.uri,
  complexTypes.Street.value.uri,
  complexTypes.Country.value.uri,
  complexTypes.ZipCode.value.uri,
  complexTypes.CompanyName.value.uri,
  complexTypes.Uuid.value.uri,
  complexTypes.Date.value.uri,
  complexTypes.LoremIpsum.value.uri
]
module.exports.class = FakeJsPlugin;
module.exports.enabled = true;