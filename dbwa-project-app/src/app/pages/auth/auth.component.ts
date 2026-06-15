import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BackendService } from '../../services/backend.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  authForm: FormGroup;
  isLoginMode = true;
  isRecoveryMode = false;
  recoveryCodeToDisplay: string | null = null;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private backendService: BackendService,
    private authService: AuthService,
    private router: Router
  ) {
    this.authForm = this.fb.group({
      username: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      recoveryCode: ['']
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.isRecoveryMode = false;
    this.error = null;
    this.successMessage = null;
    this.updateValidators();
  }

  toggleRecoveryMode() {
    this.isRecoveryMode = !this.isRecoveryMode;
    this.isLoginMode = false;
    this.error = null;
    this.successMessage = null;
    this.updateValidators();
  }

  updateValidators() {
    if (this.isLoginMode) {
      this.authForm.get('username')?.clearValidators();
      this.authForm.get('recoveryCode')?.clearValidators();
    } else if (this.isRecoveryMode) {
      this.authForm.get('username')?.clearValidators();
      this.authForm.get('recoveryCode')?.setValidators([Validators.required]);
    } else {
      this.authForm.get('username')?.setValidators([Validators.required]);
      this.authForm.get('recoveryCode')?.clearValidators();
    }
    this.authForm.get('username')?.updateValueAndValidity();
    this.authForm.get('recoveryCode')?.updateValueAndValidity();
  }

  continueToApp() {
    this.router.navigate(['/']);
  }

  onSubmit() {
    if (this.authForm.invalid) {
      this.error = 'Please fill out all fields correctly (password min. 6 characters).';
      return;
    }

    this.error = null;
    this.successMessage = null;
    const val = this.authForm.value;

    if (this.isRecoveryMode) {
      this.backendService.resetPassword({ email: val.email, recoveryCode: val.recoveryCode, newPassword: val.password }).subscribe({
        next: (res) => {
          this.successMessage = 'Password reset successfully! You can now log in.';
          setTimeout(() => {
            this.isRecoveryMode = false;
            this.isLoginMode = true;
            this.updateValidators();
            this.successMessage = null;
          }, 3000);
        },
        error: (err) => {
          this.error = err.error?.error || 'Password reset failed';
        }
      });
    } else if (this.isLoginMode) {
      this.backendService.login({ email: val.email, password: val.password }).subscribe({
        next: (res) => {
          this.authService.setToken(res.token);
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.error = err.error?.error || 'Login failed';
        }
      });
    } else {
      this.backendService.register({ username: val.username, email: val.email, password: val.password }).subscribe({
        next: (res) => {
          this.authService.setToken(res.token);
          if (res.recoveryCode) {
            this.recoveryCodeToDisplay = res.recoveryCode;
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          this.error = err.error?.error || 'Registration failed';
        }
      });
    }
  }
}
