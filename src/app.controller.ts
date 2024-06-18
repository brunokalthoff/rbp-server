import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Plant } from './interfaces';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/plants')
  getPlants(): Plant[] {
    return this.appService.getPlants();
  }

  @Get('/')
  getHealth(): string {
    return this.appService.getHealth();
  }
}
