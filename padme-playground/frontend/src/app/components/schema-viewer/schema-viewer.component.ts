import { Component, Input } from '@angular/core';
import { Dataset } from 'src/app/model/dataset';
import { DatasetType } from 'src/app/model/dataset-type';

@Component({
  selector: 'app-schema-viewer',
  templateUrl: './schema-viewer.component.html',
  styleUrls: ['./schema-viewer.component.scss']
})
export class SchemaViewerComponent {

  DatasetType = DatasetType;
 
  //The dataset that should be displayed
  @Input() dataset!: Dataset;
  
  //A list of datasets that are currently available
  @Input() datasets!: Dataset[];
  
  //Display mode that should be used
  @Input() mode: 'dark' | 'light' = "dark";

   //Possible colors used for the highlights
  colors: string[] = [
    "#c3e88d", "#ffcb6b", "#82aaff", "#f07178", "#c792ea",
    "#f78c6c", "#89ddff", "#ff5370", "#9c25a7"
  ]
}
