import { Component, ElementRef, Input, OnInit, QueryList, ViewChildren, Type } from '@angular/core';

import { DragulaService } from 'ng2-dragula';
import { DiskComponent } from '../disk/';

@Component({
  selector: 'app-vdev',
  templateUrl: 'vdev.component.html',
  styleUrls: ['vdev.component.css'],
})
export class VdevComponent implements OnInit {

  @Input() group: string;
  public type: string = 'stripe';
  private diskComponents: Array<DiskComponent> = [];

  constructor(public elementRef: ElementRef) {}

  ngOnInit() {
  }

  addDisk(disk: DiskComponent) {
    this.diskComponents.push(disk);
  }

  removeDisk(disk: DiskComponent) {
    delete this.diskComponents[this.diskComponents.indexOf(disk)];
  }

  getDisks() {
    return this.diskComponents;
  }

  onTypeChange(e) {
    console.log(e);
    console.log(this.group);
  }

}
