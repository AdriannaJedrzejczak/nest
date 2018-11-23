import { Injectable } from '@nestjs/common';
import { Cat } from '../graphql.schema';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [
    { id: 1, name: 'Azraël', age: 5, cool: true },
    { id: 2, name: 'Figaro', age: 42, cool: false },
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
