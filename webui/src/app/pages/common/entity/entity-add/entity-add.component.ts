import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { RestService } from '../../../../services/rest.service';

export abstract class EntityAddComponent implements OnInit {

  protected route_success: string[] = [];
  protected resource_name: string;
  public fields: Array<any> = [];
  public error: string;
  public data: Object = {};

  constructor(protected router: Router, protected rest: RestService, protected _injector: Injector, protected _appRef: ApplicationRef) {

  }

  ngOnInit() {

  }

  doSubmit() {
    this.error = null;
    let value = this.data;
    for(let i in value) {
      let clean = this['clean_' + i];
      if(clean) {
        value = clean(value, i);
      }
    }

    this.rest.post(this.resource_name, {
      body: JSON.stringify(value),
    }).subscribe((res) => {
      this.router.navigate(new Array('/pages').concat(this.route_success));
    }, (res) => {
      if(res.code == 409) {
	this.error = '';
        for(let i in res.error) {
	  let field = res.error[i];
          field.forEach((item, i) => {
	    this.error += item + '. ';
          });
	}
      }
    });
  }

}
