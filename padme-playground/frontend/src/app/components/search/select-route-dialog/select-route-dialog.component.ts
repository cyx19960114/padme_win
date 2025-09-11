import { Component, Inject, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { Route } from 'src/app/model/route';

@Component({
  selector: 'app-select-route-dialog',
  templateUrl: './select-route-dialog.component.html',
  styleUrls: ['./select-route-dialog.component.scss']
})
export class SelectRouteDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<SelectRouteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public route: Route
  ) { }

  ngOnInit(): void {
  }

  Cancel(): void {
    this.dialogRef.close(false);
  }

  Confirm(): void {
    this.dialogRef.close(this.route);
  }
}
