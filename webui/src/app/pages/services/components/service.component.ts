import { Component, Input } from '@angular/core';

import { RestService, WebSocketService } from '../../../services/';

import { Subscription } from 'rxjs';

@Component({
  selector: 'service',
  template: `
  <ba-card>
    <div [ngBusy]="busy">
    {{ status.label }}

    <button class="btn btn-primary" (click)="toggle()">
      <span *ngIf="status.state != 'RUNNING'">Start</span>
      <span *ngIf="status.state == 'RUNNING'">Stop</span>
    </button>

    <input type="checkbox" [checked]="status.enable" (click)="enableToggle()" /> Start on Boot
    </div>
  </ba-card>
  `,
})
export class Service {

  @Input('status') status: any;

  private busy: Subscription;

  constructor(private rest: RestService, private ws: WebSocketService) {
  }

  toggle() {

    let rpc: string;
    if(this.status.state != 'RUNNING') {
      rpc = 'service.start';
    } else {
      rpc = 'service.stop';
    }

    this.busy = this.ws.call(rpc, [this.status.service]).subscribe((res) => {
      if(res) {
        this.status.state = 'RUNNING';
      } else {
        this.status.state = 'STOPPED';
      }
    });

  }

  enableToggle() {

    this.busy = this.ws.call('service.update', [this.status.id, {enable: !this.status.enable}]).subscribe((res) => {
      if(res) {
        this.status.enable = !this.status.enable;
      }
    });

  }

}
