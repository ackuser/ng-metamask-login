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

  // Login Form
  loginForm: any;
  // Keep the wallet in your pocket
  wallet: any;
  // Chech if user is already logged
  hasSeeds = false;
  // Chech if Metamask is enabled
  isMetamaskEnabled$!: Observable<boolean>;

  /**
   * Creates an instance of login component.
   * Initialize the form with two fields and some standard& custom validation
   * @param formBuilder 
   * @param web3Service 
   */
  constructor(private formBuilder: FormBuilder, private web3Service: Web3Service) {
    this.loginForm = this.formBuilder.group({
      seeds: new FormControl(null, [Validators.required, forbiddenSeedsValidator(this.web3Service)]),
      password: new FormControl(null, [Validators.required, Validators.minLength(4)]),
    });
  }

  /**
   * on init
   */
  ngOnInit() {
    this.web3Service.getInfo();
    this.isMetamaskEnabled$ = this.web3Service.isMetamaskInstalled();
    // If user is already logged, he only has to insert the password and it should be match
    // with what he put before so we can decrypt seeds
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

  /**
   * Sends login and intialize the wallet
   */
  async sendLogin() {
    this.wallet = await this.web3Service.login(this.loginForm.value);
  }

  /**
   * Logouts login component and remove the wallet
   */
  logout() {
    this.web3Service.removeSeeds();
    this.wallet = {};
    this.hasSeeds = false;
    this.loginForm.reset();
  }

  /**
   * Logins metamask and initialize the wallet
   */
  async loginMetamask() {
    this.wallet = await this.web3Service.loginMetamask()
  }

  /**
   * Gets seeds
   */
  get seeds() { return this.loginForm.get('seeds'); }

  /**
   * Gets password
   */
  get password() { return this.loginForm.get('password'); }

}


/**
 * Forbiddens seeds validator, powerful custom validator making use of our wrapped service for web3
 * @param web3Service 
 * @returns seeds validator 
 */
function forbiddenSeedsValidator(web3Service: Web3Service): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const forbidden = !web3Service.isValidSeeds(control.value);
    return forbidden ? { forbiddenSeeds: { value: control.value } } : null;
  };
}
