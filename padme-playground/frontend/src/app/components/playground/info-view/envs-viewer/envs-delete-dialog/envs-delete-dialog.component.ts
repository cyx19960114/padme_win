import { Component, Inject, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-envs-delete-dialog',
  templateUrl: './envs-delete-dialog.component.html',
  styleUrls: ['./envs-delete-dialog.component.scss']
})
export class EnvsDeleteDialogComponent implements OnInit {

  public envName: string;
  public deleteAll = false;
  public showMultiOption: boolean; 

  constructor(
    public dialogRef: MatDialogRef<EnvsDeleteDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public data:
      {
        name: string,
        showMultiOption: boolean
      }
  ){
    this.envName = data.name;
    this.showMultiOption = data.showMultiOption;
  }

  ngOnInit(): void {
  }

  Cancel(): void {
    this.dialogRef.close({ delete: false });
  }

  Confirm(): void {
    this.dialogRef.close({ delete: true, all: this.deleteAll});
  }
}
