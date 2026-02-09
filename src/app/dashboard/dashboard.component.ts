import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { TopNavComponent } from "../layout/top-nav/top-nav.component";

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, TopNavComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {

}
