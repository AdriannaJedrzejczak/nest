import { Module } from '@nestjs/common';
import { CatsResolvers, CoolResolver } from './cats.resolvers';
import { CatsService } from './cats.service';
import { PersonsService } from './persons.service';

@Module({
  providers: [CatsService, PersonsService, CatsResolvers, CoolResolver],
})
export class CatsModule {}
