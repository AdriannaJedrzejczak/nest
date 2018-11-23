import { ParseIntPipe } from '@nestjs/common';
import {
  Args,
  Mutation,
  Query,
  Resolver,
  Subscription,
  ResolveProperty,
  Parent,
} from '@nestjs/graphql';
import { PubSub, withFilter } from 'graphql-subscriptions';

import {
  Cat,
  IMutation,
  IQuery,
  ISubscription,
  Person,
} from '../graphql.schema';
import { CatsService } from './cats.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { PersonsService } from './persons.service';

const pubSub = new PubSub();

@Resolver('Cat')
export class CatsResolvers implements IMutation, IQuery, ISubscription {
  constructor(
    private readonly catsService: CatsService,
    private readonly personsService: PersonsService,
  ) {}

  @Query()
  getCat(
    @Args('id', ParseIntPipe)
    id: string,
  ): Cat {
    return this.catsService.findOneById(+id);
  }

  @Query()
  getCats(): Cat[] {
    return this.catsService.findAll();
  }

  @ResolveProperty()
  owners(@Parent() { id: catId }: Cat): Person[] {
    return this.personsService.findByCatId(catId);
  }

  @Mutation()
  createCat(@Args('createCatInput') createCatDto: CreateCatDto): Cat {
    const cat = {
      name: createCatDto.name,
      age: createCatDto.age,
      cool: createCatDto.cool,
    };
    const catCreated = this.catsService.create(cat);

    const persons = createCatDto.owners.map(ownerName =>
      this.personsService.create({ catId: catCreated.id, name: ownerName }),
    );

    this.publishCreations(catCreated, persons);

    return catCreated;
  }

  @Mutation()
  setCool(
    @Args('id', ParseIntPipe)
    id: string,
  ): boolean {
    const person = this.personsService.setCool(+id);
    pubSub.publish('person_changed', {
      personChanged: person,
      coolChanged: person,
    });
    return !!person;
  }

  publishCreations(cat: Cat, persons: Person[]): void {
    persons.forEach(person =>
      pubSub.publish('person_changed', {
        personChanged: person,
        coolChanged: person,
      }),
    );
    pubSub.publish('cat_changed', {
      catChanged: cat,
      coolChanged: cat,
    });
  }

  @Subscription()
  catChanged(): any {
    return {
      subscribe: () => pubSub.asyncIterator('cat_changed'),
    };
  }

  @Subscription()
  personChanged(): any {
    return {
      subscribe: () => pubSub.asyncIterator('person_changed'),
    };
  }

  @Subscription()
  coolChanged(): any {
    return {
      subscribe: withFilter(
        () => pubSub.asyncIterator(['cat_changed', 'person_changed']),
        payload => payload.coolChanged.cool === true,
      ),
    };
  }

  // weird temporary hack @see https://github.com/nestjs/graphql/blob/master/lib/graphql-types.loader.ts
  temp__(): boolean | Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

@Resolver('Cool')
export class CoolResolver {
  @ResolveProperty()
  __resolveType(obj): string {
    if (obj.age) {
      return 'Cat';
    }
    return 'Person';
  }
}
