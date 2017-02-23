import { Component, Input, OnInit } from '@angular/core';

import { LineChartService } from './lineChart.service';

import 'style-loader!./lineChart.scss';

import * as Chartist from 'chartist';

declare var ChartistLegend: any;

@Component({
  selector: 'line-chart',
  templateUrl: './lineChart.html'
})
export class LineChart implements OnInit {

  chartData: Object;

  @Input() dataList: any[];
  @Input() legends: any[];

  data = {
      labels: [],
      series: [],
  };

  type = "Line";
  options = {
    showPoint: false,
    axisX: {
      labelInterpolationFnc: function(value, index) {
        return index % 40 === 0 ? value : null;
      }
    },
    plugins: []
  };
  reverseOptions = {};

  constructor(private _lineChartService: LineChartService) {
  }

  ngOnInit() {
    if(this.legends) {
      this.options.plugins.push(
        ChartistLegend({
          classNames: Array(this.legends.length).fill(0).map((x, i) => { return 'ct-series-' + String.fromCharCode(97+i)}),
          legendNames: this.legends,
        })
      );
    }
    this._lineChartService.getData(this, this.dataList);
  }

}
