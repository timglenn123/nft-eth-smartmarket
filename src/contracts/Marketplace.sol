pragma solidity ^0.5.0;

contract Marketplace {
  string public name;
  uint256 public productCount = 0;
  mapping(uint256 => Product) public products;

  struct Product {
    uint256 id;
    string name;
    uint256 price;
    address payable owner;
    bool purchased;
  }

  event ProductCreated(uint256 id, string name, uint256 price, address payable owner, bool purchased);
  event ProductPurchased(uint256 id, string name, uint256 price, address payable owner, bool purchased);

  constructor() public {
    name = "Smart Market";
  }

  function createProduct(string memory _name, uint256 _price) public {
    //make sure prameters are correct
    //require valid name
    require(bytes(_name).length > 0);
    //require valid price
    require(_price > 0);
    //increment product count
    productCount++;
    //create the product
    products[productCount] = Product(productCount, _name, _price, msg.sender, false);

    //trigger an event
    emit ProductCreated(productCount, _name, _price, msg.sender, false);
  }

  function purchaseProduct(uint256 _id) public payable {
    //fetch product
    Product memory _product = products[_id];
    //fetch owner
    address payable _seller = _product.owner;
    //make sure product is valid
    require(_product.id > 0 && _product.id <= productCount);
    //require enough ether in the tx
    require(msg.value >= _product.price);
    //require product has not been purchased
    require(!_product.purchased);
    //require buyer is not seller
    require(_seller != msg.sender);
    //transfer ownership to the buyer
    _product.owner = msg.sender;
    //mark as purchased
    _product.purchased = true;
    //update the product
    products[_id] = _product;
    //pay the seller by sending them ether
    address(_seller).transfer(msg.value);
    //trigger event
    emit ProductPurchased(productCount, _product.name, _product.price, msg.sender, true);
  }
}
