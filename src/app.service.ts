import { Injectable } from '@nestjs/common';
import { Plant } from './interfaces';
import { plants } from './data/plants';

@Injectable()
export class AppService {
  getPlants(): Plant[] {
    return plants;
  }

  getHealth(): string {
    return 'Ok';
  }
}
