import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  settings = signal([
    {
      id: 'maint',
      label: 'Maintenance Mode',
      description: 'Disable public access to the API.',
      value: false,
      category: 'System',
    },
    {
      id: 'debug',
      label: 'Debug Logging',
      description: 'Enable verbose logging for all requests.',
      value: true,
      category: 'System',
    },
    {
      id: 'reg',
      label: 'Allow Registration',
      description: 'Enable/disable new user signups.',
      value: true,
      category: 'Security',
    },
    {
      id: 'mfa',
      label: 'Enforce MFA',
      description: 'Require Multi-Factor Authentication for all users.',
      value: false,
      category: 'Security',
    },
  ]);

  loading = signal(false);
  successMessage = signal('');

  ngOnInit () {}

  saveSettings () {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.successMessage.set('Settings updated successfully!');
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 800);
  }
}
