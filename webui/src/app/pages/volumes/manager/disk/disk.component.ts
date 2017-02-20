import { Component, ElementRef, Input, OnInit, Type } from '@angular/core';

@Component({
  selector: 'app-disk',
  template: `
  <span>
    {{ data.name }}
  </span>
  `,
  styles: ['span { width: 120px; background: white; margin: 5px; padding: 2px; margin-top: 4px; }'],
})
export class DiskComponent implements OnInit {

  @Input() data: any;

  constructor(public elementRef:ElementRef) {
  }

  ngOnInit() {
  }

}
