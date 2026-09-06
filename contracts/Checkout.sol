// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract Checkout {
    address public immutable merchant;

    mapping(bytes32 => bool) public paid; // orderId => status

    event Paid(bytes32 indexed orderId, address indexed customer, address indexed token, uint256 amount);

    constructor(address _merchant) {
        require(_merchant != address(0), "invalid merchant address");
        merchant = _merchant;
    }

    function pay(bytes32 orderId, address token, uint256 amount) external {
        require(!paid[orderId], "already paid");
        require(amount > 0, "amount must be greater than zero");

        paid[orderId] = true;

        bool ok = IERC20(token).transferFrom(msg.sender, merchant, amount);
        require(ok, "token transfer failed");

        emit Paid(orderId, msg.sender, token, amount);
    }
}
