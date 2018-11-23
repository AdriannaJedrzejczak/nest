import { Injectable } from '@nestjs/common';
import { Person } from '../graphql.schema';

@Injectable()
export class PersonsService {
  private readonly persons: Person[] = [
    { id: 1, catId: 1, name: 'Gargamel', cool: false },
    { id: 2, catId: 2, name: 'Gepetto', cool: false },
    { id: 3, catId: 2, name: 'Pinocchio', cool: true },
  ];

  create(person: Person): Person {
    if (!person.id) person.id = Math.floor(Math.random() * 100000);
    person.cool = false;
    this.persons.push(person);
    return person;
  }

  setCool(id: number): Person {
    const found = this.persons.find(p => p.id === id);
    if (!found) return null;
    found.cool = true;
    return found;
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
