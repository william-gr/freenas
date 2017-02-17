import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService } from '@ng2-dynamic-forms/core';

import { GlobalState } from '../../../../global.state';
import { RestService } from '../../../../services/rest.service';

export abstract class EntityAddComponent implements OnInit {

  protected route_success: string[] = [];
  protected resource_name: string;
  protected formGroup: FormGroup;
  protected formModel: DynamicFormControlModel[];
  public fields: Array<any> = [];
  public error: string;
  public data: Object = {};

  constructor(protected router: Router, protected rest: RestService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  ngOnInit() {
    this.formGroup = this.formService.createFormGroup(this.formModel);
    this.afterInit();
  }

  afterInit() {}

  onSubmit() {
    this.error = null;
    let value = this.data;
    for(let i in value) {
      let clean = this['clean_' + i];
      if(clean) {
        value = clean(value, i);
      }
    }

    this.rest.post(this.resource_name, {
      body: JSON.stringify(this.formGroup.value),
    }).subscribe((res) => {
      this.router.navigate(new Array('/pages').concat(this.route_success));
    }, (res) => {
      if(res.code == 409) {
	this.error = '';
        for(let i in res.error) {
	  let field = res.error[i];
	  console.log(field, this.formGroup);
          field.forEach((item, j) => {
	    let fc = this.formService.findById(i, this.formModel);
	    if(fc) {
	      this.error += fc.label + ': ' + item + '<br />';
	    }
          });
	}
      }
    });
  }

}
