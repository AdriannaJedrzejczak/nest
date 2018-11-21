import { Injectable } from '@nestjs/common';
import { Person } from '../graphql.schema';

@Injectable()
export class PersonsService {
  private readonly persons: Person[] = [
    { id: 1, catId: 1, name: 'Roberto' },
    { id: 2, catId: 2, name: 'Cyril' },
    { id: 3, catId: 2, name: 'Magalie' },
  ];

  create(person: Person): Person {
    if (!person.id) person.id = Math.floor(Math.random() * 100000);
    this.persons.push(person);
    return person;
  }

  findByCatId(catId: number): Person[] {
    return this.persons.filter(person => person.catId === catId);
  }

  findByIds(owners: number[]): Person[] {
    return this.persons.filter(person =>
      owners.find(ownerId => ownerId === person.id),
    );
  }
}
