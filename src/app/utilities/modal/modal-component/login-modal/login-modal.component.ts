
import {
  AuthProviders,
  AuthService,
} from 'src/app/utilities/services/auth.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from 'src/app/utilities/services/toast.service';
import { Component, OnInit } from '@angular/core';
import { ModalComponent, ModalRef } from 'src/app/utilities/services/modal.service';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { AsyncComponent } from 'src/app/utilities/async/async.component';
import { VarDirective } from 'src/app/utilities/directives/ngVar.directive';

@Component({
  selector: 'app-login-modal',
  standalone:true,
  imports:[CommonModule,AsyncComponent,VarDirective],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss'],
})
export class LoginModalComponent implements ModalComponent,OnInit {
  loggingIn = false;
  message = null;
  webName = environment.webName;
  useEmulators = environment.useEmulators;
  constructor(
    private auth: AuthService,
    public ngbModal: NgbActiveModal,
    private toast: ToastService
  ) {
  }
  modal: ModalRef<this>;
  ngOnInit(): void {
  }
  async signIn(provider: AuthProviders) {
    this.loggingIn = true;
    const login = this.auth.signInWithProvider(provider);
    login
      .then(() => {
        this.ngbModal.close();
      })
      .catch((err) => {
        this.toast.showDanger('Auth Error', 'Cannot sign in!');
        console.error(err);
      }).finally(()=>this.loggingIn = false);
  }
  testSignIn(email,password){
    const login = this.auth.signInWithEmailAndPassword(email,password);
    login
      .then(() => {
        this.ngbModal.close();
      })
      .catch((err) => {
        this.toast.showDanger('Auth Error', 'Cannot sign in!');
        console.error(err);
      }).finally(()=>this.loggingIn = false);
  }
}
