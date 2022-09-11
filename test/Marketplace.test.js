const { assert } = require("chai");

const Marketplace = artifacts.require("./Marketplace.sol");

require("chai").use(require("chai-as-promised")).should();

contract("Marketplace", ([deployer, seller, buyer]) => {
  let marketplace;

  before(async () => {
    marketplace = await Marketplace.deployed();
  });

  describe("deployment", async () => {
    it("deploys successfully", async () => {
      const address = await marketplace.address;

      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("has a name", async () => {
      const name = await marketplace.name();
      assert.equal(name, "Smart Market");
    });
  });

  describe("products", async () => {
    let result, productCount;

    before(async () => {
      result = await marketplace.createProduct("Rays Club Seat", web3.utils.toWei("1", "Ether"), { from: seller }); //wei
      productCount = await marketplace.productCount();
    });

    it("creates products", async () => {
      //success
      assert.equal(productCount, 1);
      const event = result.logs[0].args;
      assert.equal(event.id.toNumber(), productCount.toNumber(), "id is correct");
      assert.equal(event.name, "Rays Club Seat", "name is correct");
      assert.equal(event.price, "1000000000000000000", "price is correct");
      assert.equal(event.owner, seller, "is correct");
      assert.equal(event.purchased, false, "is purchased");
      //failure Product must have a name
      await marketplace.createProduct("", web3.utils.toWei("1", "Ether"), { from: seller }).should.be.rejected;
      //failure product must have a price
      await marketplace.createProduct("Rays Club Seat", 0, { from: seller }).should.be.rejected;
    });

    it("lists products", async () => {
      //success
      const product = await marketplace.products(productCount);
      assert.equal(product.id.toNumber(), productCount.toNumber(), "id is correct");
      assert.equal(product.name, "Rays Club Seat", "name is correct");
      assert.equal(product.price, "1000000000000000000", "price is correct");
      assert.equal(product.owner, seller, "is correct");
      assert.equal(product.purchased, false, "is purchased");
    });
    it("sells products", async () => {
      //track seller balance before purchase
      let oldSellerBalance;
      oldSellerBalance = await web3.eth.getBalance(seller);
      oldSellerBalance = new web3.utils.BN(oldSellerBalance);

      //success buyer makes purchase
      result = await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei("1", "Ether") });

      //check logs
      const event = result.logs[0].args;

      const product = await marketplace.products(productCount);
      assert.equal(event.id.toNumber(), productCount.toNumber(), "id is correct");
      assert.equal(event.name, "Rays Club Seat", "name is correct");
      assert.equal(event.price, "1000000000000000000", "price is correct");
      assert.equal(event.owner, buyer, "is correct");
      assert.equal(event.purchased, true, "is purchased");
      //seller received funds
      let newSellerBalance;
      newSellerBalance = await web3.eth.getBalance(seller);
      newSellerBalance = new web3.utils.BN(newSellerBalance);

      let price;
      price = web3.utils.toWei("1", "Ether");
      price = new web3.utils.BN(price);

      const expectedBalance = oldSellerBalance.add(price);

      assert.equal(newSellerBalance.toString(), expectedBalance.toString());

      //fail try to buy product that does not exist
      await marketplace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei("1", "Ether") }).should.be.rejected;
      //failure: buyer tries to buy without enough ether
      await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei("0.5", "Ether") }).should
        .be.rejected;

      //failure: deployer tries to buy the product. (test available stock) can't be purchased twice.
      await marketplace.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei("1", "Ether") }).should
        .be.rejected;
      //failure buyer cannot be the seller

      await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei("1", "Ether") }).should.be
        .rejected;
    });
  });
});
