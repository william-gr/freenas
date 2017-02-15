import {Component, ViewEncapsulation} from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService } from './services/index';

@Component({
  selector: 'app',
  template: '<router-outlet></router-outlet>',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
  //directives: [ROUTER_DIRECTIVES]
})
export class AppComponent {
  constructor(private router: Router, private ws: WebSocketService) {
    //ws.onCloseSubject.subscribe(this.logout.bind(this));
    //ws.onOpenSubject.subscribe(this.ping.bind(this));
  }

  logout(data: any) {
    this.router.navigate(['/']);
  }

  ping() {
    this.ws.call('ping', [], res => {
      setTimeout(this.ping.bind(this), 60000);
    });
  }
}
