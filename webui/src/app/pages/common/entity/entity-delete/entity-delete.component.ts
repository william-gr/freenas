import { ApplicationRef, Component, Input, Injector, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../../services/rest.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'entity-delete',
  templateUrl: './entity-delete.component.html',
  styleUrls: ['./entity-delete.component.css']
})
export class EntityDeleteComponent implements OnInit, OnDestroy {

  @Input('conf') conf: any;

  protected pk: any;
  private sub: any;
  public error: string;
  public data: Object = {};

  private busy: Subscription;

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected _injector: Injector, protected _appRef: ApplicationRef) {
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.rest.get(this.conf.resource_name + '/' + this.pk + '/', {}).subscribe((res) => {
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
    this.busy = this.rest.delete(this.conf.resource_name + '/' + this.pk, {}).subscribe((res) => {
      this.router.navigate(new Array('/pages').concat(this.conf.route_success));
    }, (res) => {
      if(res.error.exception_class == 'ValidationErrors') {
        res.error.errors.forEach((item, i) => {
          this.error = item[0] + ': ' + item[1];
        });
      }
    });
  }

}
