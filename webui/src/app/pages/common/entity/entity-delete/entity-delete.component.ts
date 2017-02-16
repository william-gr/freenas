import { ApplicationRef, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../../services/rest.service';

export abstract class EntityDeleteComponent implements OnInit, OnDestroy {

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
      this.rest.get(this.resource_name + '/' + this.pk, {}).subscribe((res) => {
        this.data = res.data;
      }, () => {
        alert("Ooops! Failed to get!");
      });
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  doSubmit() {
    this.rest.delete(this.resource_name + '/' + this.pk, {}).subscribe((res) => {
      this.router.navigate(new Array('/dashboard').concat(this.route_success));
    }, (res) => {
      if(res.error.exception_class == 'ValidationErrors') {
        res.error.errors.forEach((item, i) => {
          this.error = item[0] + ': ' + item[1];
        });
      }
    });
  }

}
