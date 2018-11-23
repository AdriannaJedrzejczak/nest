import { ParseIntPipe, UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Query,
  Resolver,
  Subscription,
  ResolveProperty,
  Parent,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import {
  Cat,
  IMutation,
  IQuery,
  ISubscription,
  Person,
} from '../graphql.schema';
import { CatsGuard } from './cats.guard';
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
  @UseGuards(CatsGuard)
  cat(
    @Args('id', ParseIntPipe)
    id,
  ): Cat | Promise<Cat> {
    return this.catsService.findOneById(id);
  }

  @Query()
  @UseGuards(CatsGuard)
  async getCats() {
    return await this.catsService.findAll();
  }

  @ResolveProperty()
  owners(@Parent() { id: catId }) {
    return this.personsService.findByCatId(catId);
  }

  @Mutation('createCat')
  async createCat(
    @Args('createCatInput') createCatDto: CreateCatDto,
  ): Promise<Cat> {
    const cat = { name: createCatDto.name, age: createCatDto.age };
    const catCreated = await this.catsService.create(cat);

    const persons = createCatDto.owners.map(ownerName =>
      this.personsService.create({ catId: catCreated.id, name: ownerName }),
    );

    this.publishCreations(catCreated, persons);

    return catCreated;
  }

  publishCreations(catCreated: Cat, persons: Person[]): any {
    persons.forEach(personCreated =>
      pubSub.publish('person_created', { personCreated }),
    );
    pubSub.publish('cat_created', { catCreated });
  }

  @Subscription()
  catCreated(): any {
    return {
      subscribe: () => pubSub.asyncIterator('cat_created'),
    };
  }

  @Subscription()
  personCreated(): any {
    return {
      subscribe: () => pubSub.asyncIterator('person_created'),
    };
  }

  // weird temporary hack @see https://github.com/nestjs/graphql/blob/master/lib/graphql-types.loader.ts
  temp__(): boolean | Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
