import React, { Component } from "react";

import "./App.css";
import Marketplace from "../abis/Marketplace.json";
import Web3 from "web3";
import Navbar from "./Navbar";
import Main from "./Main";
class App extends Component {
  async componentDidMount() {
    await this.loadWeb3();
  }
  async loadWeb3() {
    //   const ethereumButton = document.querySelector(".enableEthereumButton");
    if (this.ethEnabled()) {
      console.log(window.web3);
    }

    //  ethereumButton.addEventListener("click", () => {
    //Will Start the metamask extension
    window.ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => {
        this.loadBlockchainData(accounts);
        //       ethereumButton.innerHTML = "Connected to Web3";
      })
      .catch((error) => {
        if (error.code === 4001) {
          // EIP-1193 userRejectedRequest error
          console.log("Please connect to MetaMask.");
        } else {
          console.error(error);
        }
      });
    //});
  }

  async ethEnabled() {
    if (window.ethereum) {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      window.web3 = new Web3(window.ethereum);
      return true;
    }
    return false;
  }
  async loadBlockchainData(accounts) {
    //console.log(accounts);
    this.setState({ account: accounts[0] });
    //console.log(Marketplace.abi, Marketplace.networks[5777].address);

    const networkId = await window.web3.eth.net.getId();
    const abi = Marketplace.abi;
    const networkData = Marketplace.networks[networkId];
    const address = Marketplace.networks[networkId].address;
    if (networkData) {
      const marketplace = await window.web3.eth.Contract(abi, address);
      const productCount = await marketplace.methods.productCount().call();
      this.setState({ productCount });
      for (var i = 1; i <= productCount; i++) {
        const product = await marketplace.methods.products(i).call();
        this.setState({ products: [...this.state.products, product] });
      }
      this.setState({ marketplace });
      this.setState({ loading: false });
      console.log(this.state.products);
    } else {
      window.alert("marketplace contract not deployed to the network");
    }
  }

  constructor(props) {
    super(props);
    this.state = { account: "", productCount: 0, products: [], loading: true };
    this.createProduct = this.createProduct.bind(this);
    this.purchaseProduct = this.purchaseProduct.bind(this);
  }

  createProduct(name, price) {
    this.setState({ loading: true });
    this.state.marketplace.methods
      .createProduct(name, price)
      .send({ from: this.state.account })
      .once("receipt", (receipt) => {
        this.setState({ loading: false });
      });
  }

  purchaseProduct(id, price) {
    this.setState({ loading: true });
    this.state.marketplace.methods
      .purchaseProduct(id)
      .send({ from: this.state.account, value: price })
      .once("receipt", (receipt) => {
        this.setState({ loading: false });
      });
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              {this.state.loading ? (
                <div id="loader" className="text-center">
                  <p className="text-center">Loading...</p>
                </div>
              ) : (
                <Main
                  products={this.state.products}
                  purchaseProduct={this.purchaseProduct}
                  createProduct={this.createProduct}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
