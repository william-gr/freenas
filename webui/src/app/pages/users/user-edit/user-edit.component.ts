import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../services/rest.service';
import { EntityEditComponent } from '../../common/entity/entity-edit/index';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['../../common/entity/entity-edit/entity-edit.component.css']
})
export class UserEditComponent extends EntityEditComponent {

  protected resource_name: string = 'user';
  protected route_delete: string[] = ['user', 'delete'];
  protected route_success: string[] = ['user'];

  public groups: any[];
  public shells: any[];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, route, rest, _injector, _appRef);
    this.rest.get('group', {}).subscribe((res) => {
      this.groups = res.data;
    });
    this.rest.openapi.subscribe(data => {
      this.shells = data['paths']['/user']['post']['parameters'][0]['schema']['properties']['shell']['enum'];
      this.data['shell'] = this.shells[0];
    })
  }

  clean_uid(value) {
    if(value['uid'] == null) {
      delete value['uid'];
    }
    return value;
  }

  clean(data) {
    delete data['groups'];
    if(data['builtin']) {
      delete data['gecos'];
      delete data['homedir'];
      delete data['username'];
      delete data['gid'];
      delete data['uid'];
    }
    delete data['builtin'];
    return data;
  }

}
