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

  protected resource_name: string = 'account/users';
  protected route_delete: string[] = ['users', 'delete'];
  protected route_success: string[] = ['users'];

  public groups: any[];
  public shells: any[];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, route, rest, _injector, _appRef);
    this.rest.get('account/groups/', {}).subscribe((res) => {
      this.groups = res.data;
    });
    this.shells = [
      '/bin/sh'
    ];
    this.data['bsdusr_shell'] = this.shells[0];
  }

  clean_uid(value) {
    if(value['uid'] == null) {
      delete value['bsdusr_uid'];
    }
    return value;
  }

  clean(data) {
    delete data['groups'];
    if(data['builtin']) {
      delete data['bsdusr_gecos'];
      delete data['bsdusr_homedir'];
      delete data['bsdusr_username'];
      delete data['bsdusr_gid'];
      delete data['bsdusr_uid'];
    }
    delete data['bsdusr_builtin'];
    return data;
  }

}
