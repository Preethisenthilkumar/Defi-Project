// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ERC20.sol";

/**
 * @dev Implementation of the MyToken.
 */

contract MyToken is ERC20 {
    constructor() ERC20("TokenAdd3", "TADD") {
        _mint(msg.sender, 1000);
        _transferOwnership(_msgSender());
        _paused = false;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Adds `amount` tokens to the receiver.
     *
     */
    function mint(address to, uint256 amount) public whenNotPaused onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Destroys `amount` tokens from the owner.
     *
     */
    function burn(address account, uint256 amount) public whenNotPaused onlyOwner{
        require(account == owner(),"Not owner balance");
        _burn(account, amount);
    }
}
