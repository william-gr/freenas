import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, } from '@angular/forms';
import { Router } from '@angular/router';

import { RestService } from '../../../services/rest.service';
import { EntityAddComponent } from '../../common/entity/entity-add/index';

@Component({
  selector: 'app-group-add',
  templateUrl: './group-add.component.html',
  styleUrls: ['../../common/entity/entity-add/entity-add.component.css']
})
export class GroupAddComponent extends EntityAddComponent {

  protected route_success: string[] = ['groups'];
  protected resource_name: string = 'account/groups/';
  public users: any[];

  constructor(protected router: Router, protected rest: RestService, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, rest, _injector, _appRef);
    this.rest.get('account/users/', {}).subscribe((res) => {
      this.users = res.data;
    });
  }

  clean_uid(value) {
    if(value['gid'] == null) {
      delete value['gid'];
    }
    return value;
  }

}
