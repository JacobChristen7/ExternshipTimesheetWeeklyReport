import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Analytics } from '../analytics/analytics';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, Analytics],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
