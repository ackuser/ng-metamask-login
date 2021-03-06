import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Observable, withLatestFrom } from 'rxjs';
import { Web3Service } from '../web3.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: any;
  mining = false;
  lastTransaction: any;
  wallet: any;
  hasSeeds = false;
  isMetamaskEnabled$!: Observable<boolean>;

  constructor(private formBuilder: FormBuilder, private web3Service: Web3Service) {
    this.loginForm = this.formBuilder.group({
      seeds: new FormControl(null, [Validators.required, forbiddenSeedsValidator(this.web3Service)]),
      password: new FormControl(null, [Validators.required, Validators.minLength(4)]),
    });
  }

  ngOnInit() {
    this.web3Service.getInfo();
    this.isMetamaskEnabled$ = this.web3Service.isMetamaskInstalled();
    if (this.web3Service.hasSeeds()) {
      this.hasSeeds = true;
      // this.loginForm.get('seeds').clearValidators();
      this.password.valueChanges
        .pipe(
          withLatestFrom(this.password.statusChanges),
        ).subscribe(() => {
          if (this.password.valid) {
            console.log('SUCESS');
            console.log(this.password.value);
            const seeds = this.web3Service.decryptSeeds(this.password.value);
            console.log(seeds)
            this.loginForm.controls.seeds.setValue(seeds);
            this.loginForm.controls.seeds.markAsDirty();
          }
        });
    }
  }

  async sendLogin() {
    this.wallet = await this.web3Service.login(this.loginForm.value);
  }

  logout() {
    this.web3Service.removeSeeds();
    this.wallet = {};
    this.hasSeeds = false;
    this.loginForm.reset();
  }

  async loginMetamask() {
    this.wallet = await this.web3Service.loginMetamask()
  }

  get seeds() { return this.loginForm.get('seeds'); }

  get password() { return this.loginForm.get('password'); }

}


function forbiddenSeedsValidator(web3Service: Web3Service): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const forbidden = !web3Service.isValidSeeds(control.value);
    return forbidden ? { forbiddenSeeds: { value: control.value } } : null;
  };
}
