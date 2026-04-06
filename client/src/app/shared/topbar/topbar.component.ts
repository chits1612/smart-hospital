import { Component, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { HospitalService } from '../../services/hospital.service';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, AsyncPipe, DatePipe],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  @Output() menuClick = new EventEmitter<void>();
  currentTime = new Date();

  constructor(public hospitalService: HospitalService) {
    setInterval(() => (this.currentTime = new Date()), 1000);
  }
}
