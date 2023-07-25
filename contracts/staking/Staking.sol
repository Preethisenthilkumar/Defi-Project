// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interface/IERC20.sol";
import "../utils/Ownable.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "./Proxiable.sol";

/**
 * @dev Implementation of the Satic (Reward rate is constant) Satking contract.
 */

contract Staking is Ownable, ReentrancyGuard, Pausable, Proxiable{
    
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
        _totalAllocatedReward = 7000000000000000000;

    }

    function stake(uint256 amount) external 
    nonReentrant 
    whenNotPaused 
    updateReward(msg.sender) 
    {
        require(amount > 0, "Invalid amount");
        _totalSupply += amount;
        _balances[msg.sender].totalSupplyBalance += amount;
        _balances[msg.sender].blockNumber = getBlockNumber();
        stakingToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

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

    function withdrawReward(uint256 amount) public 
    nonReentrant 
    whenNotPaused
    {
        require(amount > 0, "Invalid amount");
        uint rewardBalance = _balances[msg.sender].rewardBalance;
        require(rewardBalance >= amount, "Insufficient Balance");
        _balances[msg.sender].rewardBalance -= amount;
        stakingToken.transfer(msg.sender, amount);
        emit RewardPaid(msg.sender, amount);
    }

    function updateCode(address newCode) onlyOwner public {
        updateCodeAddress(newCode);
    }

    function setStakingToken(address _stakingToken) public onlyOwner{
        stakingToken = IERC20(_stakingToken);
    }

    function changeRewardRate(uint _rewardRate) public onlyOwner{
        rewardRate = _rewardRate;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /*-----------------------------Modifier------------------------------*/

    modifier updateReward(address _staker) {
        uint _amount = _balances[_staker].totalSupplyBalance;
        uint previousBlock = _balances[_staker].blockNumber;
        _balances[_staker].blockNumber = getBlockNumber();
        uint blockDelta = getBlockNumber() - previousBlock;
        if(blockDelta > 0){
            if(_amount > 0){
                _balances[_staker].rewardBalance += (blockDelta * rewardRate) * _amount;
            }
        }
        _;
    }

    /*--------------------------------------Views--------------------------------------*/

    function getReward(address _staker) public view returns (uint accruedReward){
        uint _amount = _balances[_staker].totalSupplyBalance;
        uint previousBlock = _balances[_staker].blockNumber;
        uint blockDelta = getBlockNumber() - previousBlock;
        if(blockDelta > 0){
            accruedReward = _balances[_staker].rewardBalance;
                accruedReward += (blockDelta * rewardRate) * _amount;
        }
    }

    /**
     * @notice Get the current block number
     * @return The current block number
     */
    function getBlockNumber() public view returns (uint256) {
        return block.number;
    }

}