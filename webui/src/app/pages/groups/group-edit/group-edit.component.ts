import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../services/rest.service';
import { EntityEditComponent } from '../../common/entity/entity-edit/index';

@Component({
  selector: 'app-group-edit',
  templateUrl: './group-edit.component.html',
  styleUrls: ['../../common/entity/entity-edit/entity-edit.component.css']
})
export class GroupEditComponent extends EntityEditComponent {

  protected resource_name: string = 'group';
  protected route_delete: string[] = ['group', 'delete'];
  protected route_success: string[] = ['group'];

  public users: any[];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, route, rest, _injector, _appRef);
    this.rest.get('user', {}).subscribe((res) => {
      this.users = res.data;
    });
  }

  clean(data) {
    delete data['builtin'];
    if(data['builtin']) {
      delete data['name'];
      delete data['gid'];
    }
    return data;
  }

}
