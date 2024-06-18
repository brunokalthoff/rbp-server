import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { plants } from './data/plants';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('/plants', () => {
    it('should return "Whuzzupp!"', () => {
      expect(appController.getPlants()).toBe(plants);
    });
  });
  describe('/', () => {
    it('should return "Ok"', () => {
      expect(appController.getHealth()).toBe('Ok');
    });
  });
});
