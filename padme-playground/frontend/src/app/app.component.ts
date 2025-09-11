import { Component, ViewChild } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { CodeeditorComponent } from './components/playground/codeeditor/codeeditor.component';
import { KeycloakProfile } from 'keycloak-js';
import { StateManagerService } from './services/state-manager/state-manager';
import { FileDownloadService } from './services/file-download';
import { Router } from '@angular/router';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    private keycloak: KeycloakService,
    private stateManager: StateManagerService,
    private downloader: FileDownloadService,
    private router: Router
  ) { }

  async ngOnInit() { }  

  logout()
  {
    this.keycloak.logout();
  }

  appHasNavigatedToMainPlayground() {
    return this.router.url.includes('/playground');
  }

  getRawRoute()
  {    
    const route =  this.stateManager.getRoute();

    // Extracting the required data from the original JSON
    const extractedData = {
      resources: route.halts.map(halt => {
        return {
          id: halt.station.id,
          datasets: halt.station.datasets.map(dataset => {
            return {
              id: dataset.id
            };
          })
        };
      }),
      route: route.halts.map(halt => {
        return {
          id: halt.station.id,
          ownEnvs: halt.station.ownEnvs.map(env => {
            return {
              name: env.name,
              value: env.value
            };
          })
        };
      })
    };

    const str = JSON.stringify(extractedData);
    const bytes = new TextEncoder().encode(str);
    const routeBlob = new Blob([bytes], {
      type: 'text/plain'
    });

    this.downloader.downloadBlob(routeBlob, "route.json")
  }
}
