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

  // Connect with HttpProvider with Hardhat in my case 127.0.0.1:8545
  provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
  // web3 object to interact with our decentralised world
  web3 = new Web3();
  // window to not to broke anything :P
  window: any;
  // wallet to save our Ethers!
  wallet: any;
  // bip39 path
  path = "m/44'/60'/0'/0";

  /**
   * Creates an instance of web3 service.
   */
  constructor() {
    this.web3.setProvider(this.provider);
  }

  /**
   * Gets info
   * For logging purposes, we trace some info like our web3 version
   *  what type of network and all the accounts we set up in hardhat
   */
  async getInfo() {
    const network = await this.web3.eth.net.getNetworkType();
    const accounts = await this.web3.eth.getAccounts();
    console.log(`Web3 version ${Web3.version}`);
    console.log(`Network ${network}`);
    console.log(`Accounts`, accounts);
  }

  /**
   * Gets balance 
   * "Show me the money" function allow us to check the balance belonging to an address. Take care, that we should convert from Weis
   * @param address 
   * @returns  
   */
  async getBalance(address: string) {
    console.log(address)
    const balance = await this.web3.eth.getBalance(address);
    console.log(`${balance} ETH`);
    return Web3.utils.fromWei(balance, 'ether');
  }

  /**
   * Determines whether seeds has
   * Seeds will be the key for logging into the 
   * Dapps so we save & remove them in local storage to make easier our logging. 
   * Also, we encrypt and decrypt them avoiding to be easily hacked making of crypto-js.
   * @returns  
   */
  hasSeeds() {
    return window.localStorage.getItem('seeds') != null;
  }

  /**
   * Determines whether valid seeds is
   * @param seeds 
   * @returns  
   */
  isValidSeeds(seeds: string) {
    return seeds && Mnemonic.isValid(seeds);
  }

  /**
   * Removes seeds
   */
  removeSeeds() {
    window.localStorage.removeItem('seeds');
  }

  /**
   * Encrypts seeds
   * @param seeds 
   * @param password 
   */
  encryptSeeds(seeds: string, password: string) {
    const encryptedSeeds = CryptoJS.AES.encrypt(seeds, password).toString();
    console.log(`Encrypted Seeds: ${encryptedSeeds}`);
    window.localStorage.setItem('seeds', encryptedSeeds);
  }

  /**
   * Decrypts seeds
   * @param password 
   * @returns  
   */
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

  /**
   * Login web3 service
   * @param { seeds, password } 
   * @returns  
   */
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

  /**
   * Determines whether metamask installed is
   * @returns  
   */
  isMetamaskInstalled() {
    return of((window as any).ethereum)
  }

  /**
   * Login metamask
   * @returns  
   */
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
