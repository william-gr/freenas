import {
  beforeEachProviders,
  it,
  describe,
  expect,
  inject
} from '@angular/core/testing';
import { RestService } from './rest.service';

describe('Rest Service', () => {
  beforeEachProviders(() => [RestService]);

  it('should ...',
      inject([RestService], (service: RestService) => {
    expect(service).toBeTruthy();
  }));
});
