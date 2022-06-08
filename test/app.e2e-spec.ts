import { EditBookmarkDto } from './../src/bookmark/dto/edit-bookmark.dto';
import { EditUserDto } from './../src/user/dto/edit-user.dto';
import { AuthDto } from './../src/auth/dto/auth.dto';
import { PrismaService } from './../src/prisma/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Test } from '@nestjs/testing'
import * as pactum from 'pactum'
import { CreateBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.listen(3333)
    prisma = app.get(PrismaService)
    await prisma.cleanDb()
    pactum.request.setBaseUrl('http://localhost:3333')
  })

  afterAll(() => {
    app.close();
  })

  
  describe('Auth', () => {

    const dto: AuthDto = {
      email: 'anuwat.html@gmail.com',
      password: '123'
    }
    const dto2: AuthDto = {
      email: 'max.html@gmail.com',
      password: '123'
    }

    describe('Signup', () => {

      it('should throw if email empty', () => {
        return pactum.spec().post('/auth/signup').withBody({password: dto.password}).expectStatus(400)
      })

      it('should throw if password empty', () => {
        return pactum.spec().post('/auth/signup').withBody({email: dto.email}).expectStatus(400)
      })

      it('should throw if no body provided', () => {
        return pactum.spec().post('/auth/signup').withBody({}).expectStatus(400)
      })

      it('should signup user1', () => {
        return pactum.spec().post('/auth/signup').withBody(dto).expectStatus(201)
      })

      it('should signup user2', () => {
        return pactum.spec().post('/auth/signup').withBody(dto2).expectStatus(201)
      })

    })

    describe('Signin', () => {

      it('should throw if email empty', () => {
        return pactum.spec().post('/auth/signin').withBody({password: dto.password}).expectStatus(400)
      })

      it('should throw if password empty', () => {
        return pactum.spec().post('/auth/signin').withBody({email: dto.email}).expectStatus(400)
      })

      it('should throw if no body provided', () => {
        return pactum.spec().post('/auth/signin').withBody({}).expectStatus(400)
      })

      it('should signin', () => {
        return pactum.spec().post('/auth/signin').withBody(dto).expectStatus(200).stores('userAccessToken', 'access_token')
      })

      it('should signin', () => {
        return pactum.spec().post('/auth/signin').withBody(dto2).expectStatus(200).stores('userAccessToken2', 'access_token')
      })

    })

  })

  describe('User', () => {

    describe('Get me', () => {
      it('should get current user', () => {
        return pactum.spec().get('/users/me').withHeaders({Authorization: 'Bearer $S{userAccessToken}'}).expectStatus(200)
      })
    })

    describe('Edit user', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: "Josh",
          email:"anuwat.jos@gmail.com"
        };

        return pactum.spec().patch('/users')
        .withHeaders({Authorization: 'Bearer $S{userAccessToken}'})
        .withBody(dto)
        .expectStatus(200)
        .expectBodyContains(dto.firstName)
        .expectBodyContains(dto.email)
      })
    })

  })

  describe('Bookmarks', () => {
    
    describe('Get empty bookmarks', () => {

      it('should get bookmarks', () => {
        return pactum.spec()
        .get('/bookmarks')
        .withHeaders({Authorization: 'Bearer $S{userAccessToken}'})
        .expectStatus(200).expectBody([])
      })

    })


    describe('Create bookmark', () => {
      
      const dto: CreateBookmarkDto = {
        title: "First Bookmark",
        link: "https://unknownclub.net/"
      }

      it('should create bookmarks', () => {
        return pactum.spec()
        .post('/bookmarks')
        .withHeaders({Authorization: 'Bearer $S{userAccessToken}'}).withBody(dto)
        .expectStatus(201).stores('bookmarkId', 'id')
      })

    })

    describe('Get bookmark', () => {

      it('should get bookmarks', () => {
        return pactum.spec()
        .get('/bookmarks')
        .withHeaders({Authorization: 'Bearer $S{userAccessToken}'})
        .expectStatus(200).expectJsonLength(1)
      })


    })

    describe('Get bookmark by id', () => {

      it('should get bookmark by id', () => {
        return pactum.spec()
        .get('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({Authorization: 'Bearer $S{userAccessToken}'})
        .expectStatus(200).expectBodyContains('$S{bookmarkId}')
      })


    })

    describe('Edit bookmark', () => {

      const dto: EditBookmarkDto = {
        description: "UNKCLUB **edited**"
      }

      it('should edit bookmark by id', () => {
        return pactum.spec()
        .patch('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withBody(dto)
        .withHeaders({Authorization: 'Bearer $S{userAccessToken}'})
        .expectStatus(200).expectBodyContains(dto.description)
      })


      it('should cannot edit bookmark by id', () => {
        return pactum.spec()
        .patch('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withBody(dto)
        .withHeaders({Authorization: 'Bearer $S{userAccessToken2}'})
        .expectStatus(403)
      })



    })

    describe('Delete bookmark by id', () => {

      it('should delete bookmark by id', () => {
        return pactum.spec()
        .delete('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({Authorization: 'Bearer $S{userAccessToken}'})
        .expectStatus(204)
      })

      it('should cannot get bookmark by id', () => {
        return pactum.spec()
        .get('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({Authorization: 'Bearer $S{userAccessToken}'})
        .expectStatus(404)
      })


    })

  })
   
})