import { Injectable } from '@nestjs/common';
import { Cat } from '../graphql.schema';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [
    { id: 1, name: 'Cat', age: 5 },
    { id: 2, name: 'Woody', age: 42 },
  ];

  create(cat: Cat): Cat {
    if (!cat.id) cat.id = Math.floor(Math.random() * 100000);
    this.cats.push(cat);
    return cat;
  }

  findAll(): Cat[] {
    return this.cats;
  }

  findOneById(id: number): Cat {
    return this.cats.find(cat => cat.id === id);
  }
}
