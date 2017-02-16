import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RestService } from '../../../services/rest.service';

import { GlobalState } from '../../../global.state';
import { EntityListComponent } from '../../common/entity/entity-list/index';

@Component({
  selector: 'app-user-list',
  templateUrl: '../../common/entity/entity-list/entity-list.component.html',
  styleUrls: ['../../common/entity/entity-list/entity-list.component.css']
})
export class UserListComponent extends EntityListComponent {

  protected resource_name: string = 'account/users';
  protected route_add: string[] = ['users', 'add']
  protected route_edit: string[] = ['users', 'edit']

  constructor(_rest: RestService, _router: Router, _state: GlobalState) {
    super(_rest, _router, _state);
  }

  public columns:Array<any> = [
    {title: 'Username', name: 'bsdusr_username'},
    {title: 'UID', name: 'bsdusr_uid'},
    {title: 'GID', name: 'bsdusr_group'},
    {title: 'Home directory', name: 'bsdusr_home'},
    {title: 'Shell', name: 'bsdusr_shell'},
    {title: 'Builtin', name: 'bsdusr_builtin'},
  ];
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };


}
