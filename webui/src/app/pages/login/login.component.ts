import {Component} from '@angular/core';
import {FormGroup, AbstractControl, FormBuilder, Validators} from '@angular/forms';
import { Router } from '@angular/router';

import { WebSocketService } from '../../services/index';


import 'style-loader!./login.scss';

@Component({
  selector: 'login',
  templateUrl: './login.html',
})
export class Login {

  public form:FormGroup;
  public username:AbstractControl;
  public password:AbstractControl;
  public submitted:boolean = false;
  public failed:boolean = false;

  constructor(fb:FormBuilder, private _ws: WebSocketService, private _router: Router) {
    this._ws = _ws;
    this.form = fb.group({
      'username': ['', Validators.compose([Validators.required, Validators.minLength(4)])],
      'password': ['', Validators.compose([Validators.required])]
    });

    this.username = this.form.controls['username'];
    this.password = this.form.controls['password'];
  }

  public onSubmit(values:Object):void {
    this.submitted = true;
    this.failed = false;
    if (this.form.valid) {
      this._ws.login(this.username.value, this.password.value, this.loginCallback.bind(this));
    }
  }

  loginCallback(result) {
    if(result === true) {
      this.successLogin();
    } else {
      this.errorLogin();
    }
    this.submitted = false;
  }

  successLogin() {
    this._router.navigate(['/pages', 'dashboard']);
  }

  errorLogin() {
    this.failed = true;
  }


}
