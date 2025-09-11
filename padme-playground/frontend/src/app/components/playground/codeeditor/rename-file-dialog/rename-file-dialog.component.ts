import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { EditorFile } from 'src/app/model/editor-file';
import { FileManager } from 'src/app/services/file-manager';

@Component({
  selector: 'app-rename-file-dialog',
  templateUrl: './rename-file-dialog.component.html',
  styleUrls: ['./rename-file-dialog.component.scss']
})
export class RenameFileDialogComponent implements OnInit {

  public fileName: UntypedFormControl;
  public initialFileName: string;

  constructor(
    public dialogRef: MatDialogRef<RenameFileDialogComponent>,
    public fileManager: FileManager, 
    @Inject(MAT_DIALOG_DATA) public data: { name: string }
  )
  {
    this.initialFileName = data.name;
    this.fileName = new UntypedFormControl(data.name);
  }

  ngOnInit(): void {
  }

  getErrorMessage() {
    if (this.fileName.hasError('required')) {
      return 'Please enter a file name';
    }

    return 'File already exists'
  }

  Cancel(): void {
    this.dialogRef.close();
  }

  Rename(): void{
    if (!this.fileName.invalid)
    {
      this.dialogRef.close(this.fileName.value);
    }
  }

}
