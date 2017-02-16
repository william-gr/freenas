import { ApplicationRef, Component, ComponentResolver, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { CORE_DIRECTIVES, FORM_DIRECTIVES } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MD_BUTTON_DIRECTIVES } from '@angular2-material/button';
import { MD_CARD_DIRECTIVES } from '@angular2-material/card';
import { MD_INPUT_DIRECTIVES } from '@angular2-material/input';

import { RestService } from '../../services/rest.service';
import { EntityDeleteComponent } from '../../common/entity/entity-delete/index';

@Component({
  moduleId: module.id,
  selector: 'app-group-delete',
  templateUrl: '../../common/entity/entity-delete/entity-delete.component.html',
  styleUrls: ['../../common/entity/entity-delete/entity-delete.component.css'],
  providers: [RestService],
  directives: [
    CORE_DIRECTIVES,
    FORM_DIRECTIVES,
    MD_BUTTON_DIRECTIVES,
    MD_CARD_DIRECTIVES,
    MD_INPUT_DIRECTIVES,
  ],
})
export class GroupDeleteComponent extends EntityDeleteComponent {

  protected resource_name: string = 'group';
  protected route_success: string[] = ['group'];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected _cr: ComponentResolver, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, route, rest, _cr, _injector, _appRef);
  }

}
