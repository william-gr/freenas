import { ApplicationRef, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../../services/rest.service';

import * as _ from 'lodash';

export class EntityEditComponent implements OnInit, OnDestroy {

  protected pk: any;
  protected resource_name: string;
  protected route_delete: string[];
  protected route_success: string[];
  protected formGroup: FormGroup;
  protected formModel: DynamicFormControlModel[];

  private sub: any;
  public error: string;
  public data: Object = {};

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef) {

  }

  ngOnInit() {
    this.formGroup = this.formService.createFormGroup(this.formModel);
    this.sub = this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.rest.get(this.resource_name + '/' + params['pk'] + '/', {}).subscribe((res) => {
        this.data = res.data;
	for(let i in this.data) {
	  let fg = this.formGroup.controls[i];
	  if(fg) {
	    fg.setValue(this.data[i]);
	  }
	}
      })
    });
    this.afterInit();
  }

  afterInit() { }

  clean(value) {
    return value;
  }

  gotoDelete() {
    this.router.navigate(new Array('/pages').concat(this.route_delete).concat(this.pk));
  }

  onSubmit() {
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);
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

    this.rest.put(this.resource_name + '/' + this.pk + '/', {
      body: JSON.stringify(value),
    }).subscribe((res) => {
      this.router.navigate(new Array('/pages').concat(this.route_success));
    }, (res) => {
      if(res.code == 409) {
        this.error = '';
        for(let i in res.error) {
          let field = res.error[i];
          field.forEach((item, j) => {
            let fc = this.formService.findById(i, this.formModel);
            if(fc) {
              this.error += fc.label + ': ' + item + '<br />';
            } else {
              this.error += item + '<br />';
            }
          });
        }
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
