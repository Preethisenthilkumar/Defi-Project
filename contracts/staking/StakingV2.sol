// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interface/IERC20.sol";
import "../utils/Ownable.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "./Proxiable.sol";

/**
 * @dev Implementation of the Dynamic (Reward rate varies based on supply and demand) Satking contract.
 *
 */
contract StakingV2 is Ownable, ReentrancyGuard, Pausable, Proxiable{
    
    struct Staker{
        uint totalSupplyBalance;
        uint rewardBalance;
        uint blockNumber;
    }
    mapping(address => Staker) public _balances;

    IERC20 public stakingToken;
    uint public rewardRate;
    uint256 public _totalAllocatedReward;
    uint256 public _totalSupply;
    uint256 public _totalAccruedReward;
    bool private initializationDone; // To make sure initializer is called only once

    event Staked(address user, uint256 amount);
    event Withdrawn(address user, uint256 amount);
    event RewardPaid(address user, uint256 reward);

    /*----------------------Mutative Functions ----------------------------*/


    function initializer()  public{
        require(initializationDone == false, "Already initialized");
        _transferOwnership(_msgSender());
        _paused = false;
        initializationDone = true;
        _status = _NOT_ENTERED;
        rewardRate = 1;
        _totalAllocatedReward = 70000;//can be increased later by owner
    }

    function stake(uint256 amount) external 
    nonReentrant 
    whenNotPaused 
    updateReward(msg.sender) 
    {
        require(amount > 0, "Invalid amount");
        //to make sure accrued rewards doesn't exceed allocated
        require(_totalAllocatedReward > _totalAccruedReward, "Cannot stake - limit reached");
        _totalSupply += amount;
        _balances[msg.sender].totalSupplyBalance += amount;
        _balances[msg.sender].blockNumber = getBlockNumber();
        stakingToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Unstake/withdraw amount
     * 
     */

    function withdraw(uint256 amount) public 
    nonReentrant 
    whenNotPaused
    updateReward(msg.sender) 
    {
        require(amount > 0, "Invalid amount");
        require(_balances[msg.sender].totalSupplyBalance >= amount, "Insufficient Balance");
        _totalSupply -= amount;
        _balances[msg.sender].totalSupplyBalance -= amount;
        stakingToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Withdraw accrued reward
     */

    function withdrawReward(uint256 amount) public 
    nonReentrant 
    whenNotPaused
    {
        require(amount > 0, "Invalid amount");
        require(_balances[msg.sender].totalSupplyBalance >= amount, "Insufficient Balance");
        uint rewardBalance = _balances[msg.sender].rewardBalance;
        require(rewardBalance >= amount, "Insufficient Balance");
        _balances[msg.sender].rewardBalance -= amount;
        stakingToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Upgrade/add new version of contract
     */
    function updateCode(address newCode) onlyOwner public {
        updateCodeAddress(newCode);
    }
    
    /**
     * @notice Set the address of Staking token
     */
    function setStakingToken(address _stakingToken) public onlyOwner{
        stakingToken = IERC20(_stakingToken);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @notice Set the number of reward tokens
     */
    function setAllocatedReward(uint totalAllocatedReward) public onlyOwner{
        _totalAllocatedReward = totalAllocatedReward;
    }

    /*-----------------------------Modifier------------------------------*/
    /**
     * @notice Modifier to update reward rate and accrued reward for an account
     */
    modifier updateReward(address _staker) {
        uint _rewardRate;
        uint _amount = _balances[_staker].totalSupplyBalance;
        uint previousBlock = _balances[_staker].blockNumber;
        _balances[_staker].blockNumber = getBlockNumber();
        uint blockDelta = getBlockNumber() - previousBlock;
        if(blockDelta > 0){
            if(_amount > 0){
                //reward rate adjusted depending on the allocated reward and total supply
                //reward rate increses for withdrawal and decreases for staking
                _rewardRate = (_totalAllocatedReward/_totalSupply)/1e3;
                //check to make sure reward rate is not 0
                if(_rewardRate >1 )
                rewardRate = _rewardRate;
                else 
                rewardRate = 1;
                //reward is accrued for each block, multiplied by reward rate and stake amount
                _balances[_staker].rewardBalance += ((blockDelta * rewardRate)) * _amount;
                _totalAccruedReward = _balances[_staker].rewardBalance;
            }
        }
        _;
    }


    /*--------------------------------------Views--------------------------------------*/

    function getReward(address _staker) public view returns (uint accruedReward){
        return _balances[_staker].rewardBalance;
    }

    /**
     * @notice Get the current block number
     * @return The current block number
     */
    function getBlockNumber() public view returns (uint256) {
        return block.number;
    }

}