import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getPlants(): string {
    return 'Whuzzupp!';
  }
}
