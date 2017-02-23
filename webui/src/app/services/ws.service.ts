import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';

import { Observable, Subject, Subscription } from 'rxjs/Rx';

import { Router } from '@angular/router';
import { LocalStorage } from 'ng2-webstorage';

@Injectable()
export class WebSocketService {

  onCloseSubject: Subject<any>;
  onOpenSubject: Subject<any>;
  pendingCalls: any;
  socket: any;
  connected: boolean = false;
  loggedIn: boolean = false;
  @LocalStorage() username;
  @LocalStorage() password;
  redirectUrl: string = '';

  constructor(private _router: Router) {
    this.onOpenSubject = new Subject();
    this.onCloseSubject = new Subject();
    this.pendingCalls = new Map();
    this.connect();
  }

  connect() {
    this.socket = new WebSocket('ws://' + window.location.host + '/websocket');
    this.socket.onmessage = this.onmessage.bind(this);
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onclose = this.onclose.bind(this);
  }

  onopen(event) {
    this.onOpenSubject.next(true);
    this.socket.send(JSON.stringify({
      "msg": "connect",
      "version": "1",
      "suppoer": ["1"]
    }));
  }

  onclose(event) {
    this.connected = false;
    this.onCloseSubject.next(true);
    setTimeout(this.connect.bind(this), 5000);
  }

  ping() {
    if(this.connected) {
      this.socket.send(JSON.stringify({"msg": "ping", "id": UUID.UUID()}));
      setTimeout(this.ping.bind(this), 20000);
    }
  }

  onmessage(msg) {

    try {
        var data = JSON.parse(msg.data);
    } catch (e) {
        console.warn(`Malformed response: "${msg.data}"`);
        return;
    }

    if(data.msg == "result") {
      let call = this.pendingCalls.get(data.id);
      this.pendingCalls.delete(data.id);
      if(data.error) {
        console.log("Error: ", data.error);
      }
      if(call.observer) {
        call.observer.next(data.result);
        call.observer.complete();
      }
    } else if(data.msg == "connected") {
      this.connected = true;
      setTimeout(this.ping.bind(this), 20000);
    } else if(data.msg == "pong") {
      // pass
    } else {
      console.log("Unknown message: ", data);
    }

  }

  call(method, params?: any): Observable<any> {

    let uuid = UUID.UUID();
    let payload = {
      "id": uuid,
      "msg": "method",
      "method": method,
      "params": params
    };

    let source = Observable.create((observer) => {
      this.pendingCalls.set(uuid, {
        "method": method,
        "args": params,
        "observer": observer,
      });

      this.socket.send(JSON.stringify(payload));
    });

    return source;

  }

  login(username, password): Observable<any> {
    this.username = username;
    this.password = password;
    return Observable.create((observer) => {
      this.call('auth.login', [username, password]).subscribe((result) => {
        if(result === true) {
          this.loggedIn = true;
        } else {
          this.loggedIn = false;
        }
        observer.next(result);
        observer.complete();
      });
    });
  }

  logout() {
    this.loggedIn = false;
    this.username = '';
    this.password = '';
    this._router.navigate(['/login']);
  }

}
