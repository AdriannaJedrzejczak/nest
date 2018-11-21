import { Module } from '@nestjs/common';
import { CatsResolvers } from './cats.resolvers';
import { CatsService } from './cats.service';
import { PersonsService } from './persons.service';

@Module({
  providers: [CatsService, PersonsService, CatsResolvers],
})
export class CatsModule {}
