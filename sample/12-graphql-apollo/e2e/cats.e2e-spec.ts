import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { ApplicationModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

describe('e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();
    app = await moduleFixture.createNestApplication().init();
  });

  it('should send cats to you', async done => {
    return supertest(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
            getCats {
              id
            }
          }`,
      })
      .expect(200, done);
  });

  afterAll(async () => {
    await app.close();
  });
});
