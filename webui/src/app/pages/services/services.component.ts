import { Component, OnInit } from '@angular/core';

import { RestService, WebSocketService } from '../../services/';

import { Subscription } from 'rxjs';

@Component({
  selector: 'services',
  styleUrls: ['./services.scss'],
  templateUrl: './services.html'
})
export class Services implements OnInit {

  protected services: any[];
  private busy: Subscription;

  constructor(protected rest: RestService, protected ws: WebSocketService) {
  }

  ngOnInit() {

    this.busy = this.ws.call('service.query', []).subscribe((res) => {
      this.services = res;
    });

  }


}
