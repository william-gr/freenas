import { ApplicationRef, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MdButton } from '@angular2-material/button/button';
import { MdCheckbox } from '@angular2-material/checkbox/checkbox';
import { MdInput } from '@angular2-material/input/input';

import { RestService } from '../../../../services/rest.service';

import * as _ from 'lodash';

export abstract class EntityEditComponent implements OnInit, OnDestroy {

  protected pk: any;
  protected resource_name: string;
  protected route_delete: string[];
  protected route_success: string[];

  private sub: any;
  public error: string;
  public data: Object = {};

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected _injector: Injector, protected _appRef: ApplicationRef) {

  }

  ngOnInit() {

    this.sub = this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.rest.get(this.resource_name + '/' + params['pk'], {}).subscribe((res) => {
        this.data = res.data;
      })
    });
  }

  clean(value) {
    return value;
  }

  gotoDelete() {
    this.router.navigate(new Array('/dashboard').concat(this.route_delete).concat(this.pk));
  }

  doSubmit() {
    this.error = null;
    let value = _.cloneDeep(this.data);
    for(let i in value) {
      let clean = this['clean_' + i];
      if(clean) {
        value = clean(value, i);
      }
    }
    if('id' in value) {
      delete value['id'];
    }
    value = this.clean(value);

    this.rest.put(this.resource_name + '/' + this.pk, {
      body: JSON.stringify(value),
    }).subscribe((res) => {
      this.router.navigate(new Array('/dashboard').concat(this.route_success));
    }, (res) => {
      if(res.error['exception_class'] == 'ValidationErrors') {
        res.error.errors.forEach((item, i) => {
          this.error = item[0] + ': ' + item[1];
        });
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
