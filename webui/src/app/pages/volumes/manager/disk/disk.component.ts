import { Component, ElementRef, Input, OnInit, Type } from '@angular/core';

@Component({
  selector: 'app-disk',
  template: `
  <span>
    {{ data.devname }}
  </span>
  `,
  styles: ['span { min-width: 120px; margin: 5px; padding: 2px; margin-top: 4px; border: 1px solid #ddd; }'],
})
export class DiskComponent implements OnInit {

  @Input() data: any;

  constructor(public elementRef:ElementRef) {
  }

  ngOnInit() {
  }

}
