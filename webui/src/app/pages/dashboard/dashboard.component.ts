import { Component, OnInit } from '@angular/core';

import { WebSocketService } from '../../services/';

@Component({
  selector: 'dashboard',
  styleUrls: ['./dashboard.scss'],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {

  protected info: any = {};

  constructor(private ws: WebSocketService) {
  }

  ngOnInit() {
    this.ws.call('system.info').subscribe((res) => {
      this.info = res;
      this.info.loadavg = this.info.loadavg.map((x, i) => { return x.toFixed(2); }).join(' ');
      this.info.physmem = Number(this.info.physmem / 1024 / 1024).toFixed(0) + ' MiB';
    });
  }

}
