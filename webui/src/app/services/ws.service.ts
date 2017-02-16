import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';

import { Subject } from 'rxjs/Rx';

@Injectable()
export class WebSocketService {

  onCloseSubject: Subject<any>;
  onOpenSubject: Subject<any>;
  pendingCalls: any;
  socket: any;
  connected: boolean = false;
  loggedIn: boolean = false;

  constructor() {
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
    this.connected = true;
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
      call.callback(data.result);
    } else {
      console.log("Unknown message: ", data);
    }

  }

  call(method, params, callback) {

    let uuid = UUID.UUID();
    let payload = {
      "id": uuid,
      "msg": "method",
      "method": method,
      "params": params
    };
    console.log(payload);

    this.pendingCalls.set(uuid, {
        "method": method,
        "args": params,
        "callback": callback
    });

    this.socket.send(JSON.stringify(payload));

  }

  login(username, password, callback) {
    let me = this;
    function doCallback(result) {
        me.loginCallback(result);
        if(callback) { callback(result) };
    }
    this.call('auth.login', [username, password], doCallback);
  }

  loginCallback(result) {
    if(result === true) {
      this.loggedIn = true;
    } else {
      this.loggedIn = false;
    }
  }

}
