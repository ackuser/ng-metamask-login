import { Injectable } from '@angular/core';
import { hdkey } from "ethereumjs-wallet";
import * as bip39 from "bip39";
import Web3 from 'web3'
import * as Mnemonic from "bitcore-mnemonic";
import * as CryptoJS from "crypto-js";
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

  provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
  web3 = new Web3();
  window: any;
  wallet: any;
  path = "m/44'/60'/0'/0";

  constructor() {
    this.web3.setProvider(this.provider);
  }

  async getInfo() {
    const network = await this.web3.eth.net.getNetworkType();
    const accounts = await this.web3.eth.getAccounts();
    console.log(`Web3 version ${Web3.version}`);
    console.log(`Network ${network}`);
    console.log(`Accounts`, accounts);
  }

  async getBalance(address: string) {
    console.log(address)
    const balance = await this.web3.eth.getBalance(address);
    console.log(`${balance} ETH`);
    return Web3.utils.fromWei(balance, 'ether');
  }

  hasSeeds() {
    return window.localStorage.getItem('seeds') != null;
  }

  isValidSeeds(seeds: string) {
    return seeds && Mnemonic.isValid(seeds);
  }

  removeSeeds() {
    window.localStorage.removeItem('seeds');
  }

  encryptSeeds(seeds: string, password: string) {
    const encryptedSeeds = CryptoJS.AES.encrypt(seeds, password).toString();
    console.log(`Encrypted Seeds: ${encryptedSeeds}`);
    window.localStorage.setItem('seeds', encryptedSeeds);
  }

  decryptSeeds(password: string) {
    const seedsBuffer = CryptoJS.AES.decrypt(window.localStorage.getItem('seeds'), password);
    const seeds = seedsBuffer.toString(CryptoJS.enc.Utf8);
    if (!this.isValidSeeds(seeds)) {
      return null;
    }
    else {
      console.log(seeds)
      return seeds.toString(CryptoJS.enc.Utf8);
    }
  }

  async login({ seeds, password }: any) {
    this.encryptSeeds(seeds, password)
    console.log('seeds')
    console.log(seeds)
    const seedsUint8Array = await bip39.mnemonicToSeed(seeds);
    console.log('seeds Uint8Array')
    console.log(seedsUint8Array)
    this.wallet = hdkey
      .fromMasterSeed(seedsUint8Array)
      .derivePath(`${this.path}/${2}`)
      .getWallet();
    console.log(this.wallet)
    const address = this.wallet.getAddressString();
    const balance = await this.getBalance(address);
    console.log(`Address: ${address}`);
    console.log(`Private Key: ${this.wallet.getPrivateKeyString()}`);
    const payload = {
      address,
      balance
    }
    return { ...this.wallet, ...payload };
  }

  isMetamaskInstalled() {
    return of((window as any).ethereum)
  }

  async loginMetamask() {
    const eth = (window as any).ethereum;
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' })
      console.log(accounts[0])
      const address = accounts[0];
      console.log(address)
      const balance = await this.getBalance(address);
      const payload = {
        address,
        balance
      }
      return { ...this.wallet, ...payload };
    } catch (error) {
      if ((error as any).code == -32002) {
        alert('Please connect to MetaMask.');
      } else {
        console.error(error);
      }
    }
  }
}
