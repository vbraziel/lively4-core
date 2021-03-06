import Morph from 'src/components/widgets/lively-morph.js';
import Wallet from 'src/blockchain/model/wallet/wallet.js';
import forge from 'node_modules/node-forge/dist/forge.min.js';

export default class BlockchainWallet extends Morph {
  
  async initialize() {
    this.windowTitle = "BlockchainWalletView";
    this._wallet = null;
  }
  
  set wallet(wallet) {
    this._wallet = wallet;
    this.update();
  }
  
  get wallet() {
    return this._wallet
  }

  async update() {
    if(!this._wallet) {
      return
    }
    this.shadowRoot.querySelector('#hash').innerHTML = this._wallet.displayName;
    const sha256PublicKey = forge.md.sha256.create();
    const publicKeyHash =  sha256PublicKey.update(this._wallet.publicKey.n.data).digest().toHex().substring(0, 10);
    this.shadowRoot.querySelector('#publicKey span').innerHTML = '#' + publicKeyHash;
    const sha256PrivateKey = forge.md.sha256.create();
    const privateKeyHash = sha256PrivateKey.update(this._wallet._privateKey.d.data).digest().toHex().substring(0, 10);
    this.shadowRoot.querySelector('#privateKey span').innerHTML = '#' + privateKeyHash;
    this.shadowRoot.querySelector('#value span').innerHTML = "μ" + this._wallet.value;
    this._createInputList();
  }
  
  _createInputList() {
    const inputList = this.shadowRoot.querySelector('#transaction-list');
    inputList.innerHTML = "";

    this.wallet._receivedTransactions.forEach(transaction => {
      const transactionInputWrapper = document.createElement('div');
      transactionInputWrapper.innerHTML = '<i class="fa fa-sign-in" aria-hidden="true"></i> ' + transaction.displayName + ' <span class="color-green">µ' + transaction.outputs.get(this._wallet.hash).value + '</span>';
      inputList.appendChild(transactionInputWrapper);
    });
  }

  async livelyExample() {
    this.wallet = new Wallet();
  }
  
  
}