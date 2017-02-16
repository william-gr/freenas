import { ApplicationRef, Component, ComponentResolver, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { CORE_DIRECTIVES } from '@angular/common';
import { FORM_DIRECTIVES } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MD_BUTTON_DIRECTIVES } from '@angular2-material/button';
import { MD_CARD_DIRECTIVES } from '@angular2-material/card';
import { MD_CHECKBOX_DIRECTIVES } from '@angular2-material/checkbox';
import { MD_INPUT_DIRECTIVES } from '@angular2-material/input';

import { RestService } from '../../services/rest.service';
import { EntityEditComponent } from '../../common/entity/entity-edit/index';

@Component({
  moduleId: module.id,
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['../../common/entity/entity-edit/entity-edit.component.css'],
  providers: [RestService],
  directives: [
    CORE_DIRECTIVES,
    FORM_DIRECTIVES,
    MD_BUTTON_DIRECTIVES,
    MD_CARD_DIRECTIVES,
    MD_CHECKBOX_DIRECTIVES,
    MD_INPUT_DIRECTIVES,
  ],
})
export class UserEditComponent extends EntityEditComponent {

  protected resource_name: string = 'user';
  protected route_delete: string[] = ['user', 'delete'];
  protected route_success: string[] = ['user'];

  public groups: any[];
  public shells: any[];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected _cr: ComponentResolver, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, route, rest, _cr, _injector, _appRef);
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
