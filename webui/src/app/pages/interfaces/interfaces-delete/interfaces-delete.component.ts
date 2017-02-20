import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../services/rest.service';
import { EntityDeleteComponent } from '../../common/entity/entity-delete/index';

@Component({
  selector: 'app-group-delete',
  templateUrl: '../../common/entity/entity-delete/entity-delete.component.html',
  styleUrls: ['../../common/entity/entity-delete/entity-delete.component.css']
})
export class InterfacesDeleteComponent extends EntityDeleteComponent {

  protected resource_name: string = 'network/interface/';
  protected route_success: string[] = ['interfaces'];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, route, rest, _injector, _appRef);
  }

}
