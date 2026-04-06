import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  @Input() collapsed = false;

  navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      ],
    },
    {
      title: 'Clinical',
      items: [
        { label: 'Patients',    path: '/patients', icon: 'patients' },
        { label: 'ICU Monitor', path: '/icu',      icon: 'icu'      },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Alerts', path: '/alerts', icon: 'alerts' },
      ],
    },
  ];
}
