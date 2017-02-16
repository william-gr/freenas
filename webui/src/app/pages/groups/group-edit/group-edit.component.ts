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
  selector: 'app-group-edit',
  templateUrl: './group-edit.component.html',
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
export class GroupEditComponent extends EntityEditComponent {

  protected resource_name: string = 'group';
  protected route_delete: string[] = ['group', 'delete'];
  protected route_success: string[] = ['group'];

  public users: any[];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected _cr: ComponentResolver, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, route, rest, _cr, _injector, _appRef);
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
