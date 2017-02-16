import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { GlobalState } from '../../../global.state';
import { RestService } from '../../../services/rest.service';
import { EntityAddComponent } from '../../common/entity/entity-add/index';

@Component({
  selector: 'app-user-add',
  templateUrl: './user-add.component.html',
  styleUrls: ['../../common/entity/entity-add/entity-add.component.css']
})
export class UserAddComponent extends EntityAddComponent {

  protected route_success: string[] = ['users'];
  protected resource_name: string = 'account/users/';
  public groups: any[];
  public shells: any[];

  constructor(protected router: Router, protected rest: RestService, protected _injector: Injector, protected _appRef: ApplicationRef, _state: GlobalState) {
    super(router, rest, _injector, _appRef, _state);
    this.rest.get('account/groups/', {}).subscribe((res) => {
      this.groups = res.data;
    });
    this.rest.get(this.resource_name, {}).subscribe((res) => {
      this.groups = res.data;
      let uid = 999;
      res.data.forEach((item, i) => {
        if(item.bsdusr_uid > uid) uid = item.bsdusr_uid;
      });
      uid += 1;
      this.data['bsdusr_uid'] = uid;
    });
    this.shells = [
      '/bin/sh',
    ]
    this.data['bsdusr_shell'] = this.shells[0];
  }

  clean_uid(value) {
    if(value['uid'] == null) {
      delete value['uid'];
    }
    return value;
  }

}
