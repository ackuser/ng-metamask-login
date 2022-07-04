import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import * as Mnemonic from "bitcore-mnemonic";
import * as CryptoJS from "crypto-js";
import { hdkey } from "ethereumjs-wallet";
import * as bip39 from "bip39";
import * as util from "ethereumjs-util";
import Web3 from 'web3';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm = this.formBuilder.group({
    seeds: '',
    password: ''
  });;
  sendForm = this.formBuilder.group({
    to: '',
    amount: ''
  });;
  encryptedSeeds: any;
  wallet!: {
    address: string;
    balance: string;
  };
  provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
  web3 = new Web3();
  window: any;
  mining = false;
  lastTransaction: any;

  constructor(private formBuilder: FormBuilder) {
    this.window = document.defaultView;
    this.web3.setProvider(this.provider);
  }

  async ngOnInit() {
    this.encryptedSeeds = window.localStorage.getItem('seeds');

    const network = await this.web3.eth.net.getNetworkType();
    // await window.ethereum.enable();
    const accounts = await this.web3.eth.getAccounts();
    // setAccount(accounts[0]);
    console.log(`Web3 version ${Web3.version}`);
    console.log(`Network ${network}`);
    console.log(`Accounts`, accounts);

    const mnemonic = new Mnemonic("test test test test test test test test test test test junk");
    const seed = await bip39.mnemonicToSeed(mnemonic.toString());
    const path = "m/44'/60'/0'/0/0";
    const wallet = hdkey
      .fromMasterSeed(seed)
      .derivePath(`${path}/${2}`)
      .getWallet();

    for (let i = 0; i < 10; i++) {
      const wallet = hdkey
        .fromMasterSeed(seed)
        .derivePath(`${path}/${i}`)
        .getWallet();
      console.log(`Account #${i}: ${wallet.getAddressString()}`);
      console.log(`Private Key: ${wallet.getPrivateKeyString()}`);
    }

    const privateKey = wallet.getPrivateKey();
    const publicKey = util.privateToPublic(privateKey);
    const address = `0x${util.pubToAddress(publicKey).toString('hex')}`;
    console.log(mnemonic)
    console.log(seed)
    console.log(`Address: ${wallet.getAddressString()}`);
    console.log(`Private Key: ${wallet.getPrivateKeyString()}`);

    // const account = accounts.find(val => val.toLowerCase() == "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
    // console.log(account)
    await this.getBalance(address as string);
  }

  async getBalance(address: string) {
    const balance = await this.web3.eth.getBalance(address);
    console.log(`${balance} ETH`);
    return Web3.utils.fromWei(balance, 'ether');
  }

  sendLogin({ seeds, password }: any) {
    if (password == '') {
      return alert('Introduce tu contraseña');
    }

    if (this.encryptedSeeds) {
      const decrypt = CryptoJS.AES.decrypt(this.encryptedSeeds, password);
      seeds = decrypt.toString(CryptoJS.enc.Utf8);
    }

    if (!Mnemonic.isValid(seeds)) {
      return alert('Semilla inválida');
    }

    console.log(`Seeds: ${seeds}`);
    console.log(`Password: ${password}`);

    const encryptedSeeds = CryptoJS.AES.encrypt(seeds, password).toString();

    console.log(`Encrypted Seeds: ${encryptedSeeds}`);

    window.localStorage.setItem('seeds', encryptedSeeds);

    this.loginForm.reset();

    // this.initWallet(loginData.seed);
  }

  removeSeeds() {
    window.localStorage.removeItem('seeds');
    this.encryptedSeeds = '';
    this.wallet = {
      address: '',
      balance: ''
    };
  }

  loginWithMetamask() {
    if (!this.window.ethereum) {
      return alert('Metamask no está instalado');
    }

    this.window.ethereum.enable().then((accounts: any) => {
      console.log(accounts)
      let address = accounts[0];
      this.getBalance(address);
    });
  }

}
