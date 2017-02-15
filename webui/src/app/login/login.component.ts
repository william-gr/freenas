import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService } from '../services/index';

@Component({
  selector : 'login',
  styleUrls: ['./login.component.css'],
  templateUrl : './login.component.html'
})
export class LoginComponent {

  public user:string;
  public password:string;
  public failed:boolean = false;

  constructor( private _router: Router, private _ws: WebSocketService) {
    this._router = _router;
    this._ws = _ws;
  }

  doLogin() {
    this._ws.call('auth.login', [this.user, this.password], this.loginCallback.bind(this));
  }

  loginCallback(result) {
    if(result === true) {
      this.successLogin();
    } else {
      this.errorLogin();
    }
  }

  successLogin() {
    this._router.navigate(['/dashboard', 'home']);
  }

  errorLogin() {
    this.failed = true;
  }

}
