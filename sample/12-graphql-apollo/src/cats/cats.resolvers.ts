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
import { Cat } from '../graphql.schema';
import { CatsGuard } from './cats.guard';
import { CatsService } from './cats.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { PersonsService } from './persons.service';

const pubSub = new PubSub();

@Resolver('Cat')
export class CatsResolvers {
  constructor(
    private readonly catsService: CatsService,
    private readonly personsService: PersonsService,
  ) {}

  @Query()
  @UseGuards(CatsGuard)
  async getCats() {
    return await this.catsService.findAll();
  }

  @Query('cat')
  async findOneById(
    @Args('id', ParseIntPipe)
    id: number,
  ): Promise<Cat> {
    return await this.catsService.findOneById(id);
  }

  @Mutation('createCat')
  async create(@Args('createCatInput') args: CreateCatDto): Promise<Cat> {
    const cat = { name: args.name, age: args.age };
    const createdCat = await this.catsService.create(cat);

    args.owners.forEach(ownerName =>
      this.personsService.create({ catId: createdCat.id, name: ownerName }),
    );

    pubSub.publish('catCreated', { catCreated: createdCat });
    return createdCat;
  }

  @Subscription('catCreated')
  catCreated() {
    return {
      subscribe: () => pubSub.asyncIterator('catCreated'),
    };
  }

  @ResolveProperty()
  owners(@Parent() { id: catId }) {
    return this.personsService.findByCatId(catId);
  }
}
