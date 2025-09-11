import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularMaterialModule } from './material.module';
import { HttpClientModule } from '@angular/common/http';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { CodeeditorComponent } from './components/playground/codeeditor/codeeditor.component';
import { EditorComponent } from './components/playground/editor/editor.component';
import { SearchComponent } from './components/search/search.component';
import { PlaygroundComponent } from './components/playground/playground.component';
import { ResizeDirective } from './directives/resize.directive';
import { NewFileDialogComponent } from './components/playground/codeeditor/new-file-dialog/new-file-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FileValidatorDirective } from './directives/file-validator.directive';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { TemplateDialogComponent } from './components/playground/codeeditor/template-dialog/template-dialog.component';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { DeleteFileDialogComponent } from './components/playground/codeeditor/delete-file-dialog/delete-file-dialog.component';
import { InfoViewComponent } from './components/playground/info-view/info-view.component';
import { ResultsViewerComponent } from './components/playground/info-view/results-viewer/results-viewer.component';
import { EnvsViewerComponent } from './components/playground/info-view/envs-viewer/envs-viewer.component';
import { SchemaViewerComponent } from './components/schema-viewer/schema-viewer.component';
import { MatLegacyTabsModule as MatTabsModule}  from '@angular/material/legacy-tabs';
import { OuputViewerComponent } from './components/playground/info-view/ouput-viewer/ouput-viewer.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NgxGraphFixDirective } from './directives/ngx-graph-fix.directive';
import { MatExpansionModule } from '@angular/material/expansion';
import { SchemaDetailsViewerComponent } from './components/schema-details-viewer/schema-details-viewer.component';
import { DataSourceSelectorComponent } from './components/search/data-source-selector/data-source-selector.component';
import { SelectRouteDialogComponent } from './components/search/select-route-dialog/select-route-dialog.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RouteSelectorComponent } from './components/route-selector/route-selector.component';
import { WelcomeDialogComponent } from './components/search/welcome-dialog/welcome-dialog.component';
import { LoadingDialogComponent } from './components/search/loading-dialog/loading-dialog.component';
import { DatasetSelectorComponent } from './components/playground/info-view/dataset-selector/dataset-selector.component';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { providers } from 'src/environments/environment-providers';
import { MatSortModule } from '@angular/material/sort';
import { EnvEditorDialogComponent } from './components/playground/info-view/envs-viewer/env-editor-dialog/env-editor-dialog.component';
import { EnvsDeleteDialogComponent } from './components/playground/info-view/envs-viewer/envs-delete-dialog/envs-delete-dialog.component';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { RouteViewerComponent } from './components/playground/info-view/route-viewer/route-viewer.component';
import { SessionTerminatedDialogComponent } from './components/playground/session-terminated-dialog/session-terminated-dialog.component';
import { KeycloakAngularModule } from 'keycloak-angular';
import { UploadFileDialogComponent } from './components/playground/codeeditor/upload-file-dialog/upload-file-dialog.component';
import { FileDragNDropDirective } from './directives/file-drag-ndrop.directive';
import { OverwriteFileDialogComponent } from './components/playground/codeeditor/overwrite-file-dialog/overwrite-file-dialog.component';
import { RenameFileDialogComponent } from './components/playground/codeeditor/rename-file-dialog/rename-file-dialog.component';
import { MatTreeModule } from '@angular/material/tree';
import { MainWelcomeDialogComponent } from './components/playground/main-welcome-dialog/main-welcome-dialog.component';
import { FileVisualizerComponent } from './components/playground/info-view/results-viewer/file-visualizer/file-visualizer.component';
import { NgxResize } from 'ngx-resize';

//Register locale
import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import { RetrySnackBarComponent } from './components/playground/info-view/ouput-viewer/retry-snack-bar/retry-snack-bar.component';
import { RelationalSchemaViewerComponent } from './components/schema-viewer/relational-schema-viewer/relational-schema-viewer.component';
import { ObjectSchemaViewerComponent } from './components/schema-viewer/object-schema-viewer/object-schema-viewer.component';
registerLocaleData(localeDE);

@NgModule({
  declarations: [
    AppComponent,
    CodeeditorComponent,
    EditorComponent,
    SearchComponent,
    PlaygroundComponent,
    ResizeDirective,
    NewFileDialogComponent,
    FileValidatorDirective,
    TemplateDialogComponent,
    DeleteFileDialogComponent,
    InfoViewComponent,
    ResultsViewerComponent,
    EnvsViewerComponent,
    SchemaViewerComponent,
    OuputViewerComponent,
    NgxGraphFixDirective,
    SchemaDetailsViewerComponent,
    DataSourceSelectorComponent,
    SelectRouteDialogComponent,
    RouteSelectorComponent,
    WelcomeDialogComponent,
    LoadingDialogComponent,
    DatasetSelectorComponent,
    EnvEditorDialogComponent,
    EnvsDeleteDialogComponent,
    RouteViewerComponent,
    SessionTerminatedDialogComponent,
    UploadFileDialogComponent,
    FileDragNDropDirective,
    OverwriteFileDialogComponent,
    RenameFileDialogComponent, 
    MainWelcomeDialogComponent, FileVisualizerComponent, RetrySnackBarComponent, RelationalSchemaViewerComponent, ObjectSchemaViewerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularMaterialModule, 
    FormsModule, 
    HttpClientModule, 
    CodemirrorModule, 
    ReactiveFormsModule, 
    MatTooltipModule, 
    MatCardModule, 
    MatCheckboxModule, 
    MatProgressSpinnerModule, 
    MatMenuModule, 
    MatTabsModule, 
    NgxGraphModule, 
    MatExpansionModule, 
    DragDropModule, 
    MatSlideToggleModule, 
    MatSortModule, 
    MatProgressBarModule, 
    KeycloakAngularModule, 
    MatTreeModule,
    NgxResize,
  ],
  bootstrap: [AppComponent], 
  providers: [
    ...providers,
  ],
})
export class AppModule { }
