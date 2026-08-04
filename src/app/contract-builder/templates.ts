// src/app/contract-builder/templates.ts
import React, { ReactNode } from 'react';
import { Cube, Lightning, Gear } from 'phosphor-react';

export interface ContractTemplate {
  name: string;
  description: string;
  icon: ReactNode;
  features: string[];
  defaultParams?: Record<string, string>;
  baseCode: string;
}

// Simple, secure ERC20 token - Production ready
const ERC20_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    bool public paused;
    
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
        
        totalSupply = _initialSupply * 10**decimals;
        balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
    
    function transfer(address to, uint256 amount) public whenNotPaused returns (bool) {
        require(to != address(0), "Zero address");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address _owner, address spender) public view returns (uint256) {
        return allowances[_owner][spender];
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public whenNotPaused returns (bool) {
        require(to != address(0), "Zero address");
        require(balances[from] >= amount, "Insufficient balance");
        require(allowances[from][msg.sender] >= amount, "Insufficient allowance");
        
        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Zero address");
        totalSupply += amount;
        balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function burn(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
    
    function pause() public onlyOwner {
        paused = true;
    }
    
    function unpause() public onlyOwner {
        paused = false;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}`;

// Simple, secure NFT - Production ready  
const NFT_BASE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleNFT {
    string public name;
    string public symbol;
    address public owner;
    bool public paused;
    
    string private baseURI;
    uint256 private nextTokenId;
    uint256 public constant maxSupply = 10000;
    
    mapping(uint256 => address) private owners;
    mapping(address => uint256) private balances;
    mapping(uint256 => address) private tokenApprovals;
    mapping(address => mapping(address => bool)) private operatorApprovals;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    constructor(string memory _name, string memory _symbol, string memory _baseURI) {
        name = _name;
        symbol = _symbol;
        baseURI = _baseURI;
        owner = msg.sender;
    }
    
    function balanceOf(address _owner) public view returns (uint256) {
        require(_owner != address(0), "Zero address");
        return balances[_owner];
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = owners[tokenId];
        require(tokenOwner != address(0), "Token doesn't exist");
        return tokenOwner;
    }
    
    function approve(address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner || operatorApprovals[tokenOwner][msg.sender], "Not authorized");
        tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view returns (address) {
        require(owners[tokenId] != address(0), "Token doesn't exist");
        return tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public {
        operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address _owner, address operator) public view returns (bool) {
        return operatorApprovals[_owner][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public whenNotPaused {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        require(ownerOf(tokenId) == from, "Wrong owner");
        require(to != address(0), "Zero address");
        
        delete tokenApprovals[tokenId];
        balances[from] -= 1;
        balances[to] += 1;
        owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    function mint(address to) public onlyOwner whenNotPaused returns (uint256) {
        require(to != address(0), "Zero address");
        require(nextTokenId < maxSupply, "Max supply reached");
        
        uint256 tokenId = nextTokenId++;
        owners[tokenId] = to;
        balances[to] += 1;
        
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }
    
    function burn(uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        address tokenOwner = ownerOf(tokenId);
        
        delete tokenApprovals[tokenId];
        balances[tokenOwner] -= 1;
        delete owners[tokenId];
        
        emit Transfer(tokenOwner, address(0), tokenId);
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || getApproved(tokenId) == spender || operatorApprovals[tokenOwner][spender]);
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(owners[tokenId] != address(0), "Token doesn't exist");
        return string(abi.encodePacked(baseURI, _toString(tokenId)));
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }
    
    function pause() public onlyOwner {
        paused = true;
    }
    
    function unpause() public onlyOwner {
        paused = false;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}`;

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    name: 'ERC20 Token',
    description: 'Create a custom ERC20 token with advanced features',
    icon: React.createElement(Cube, { size: 24 }),
    features: ['Mintable', 'Burnable', 'Pausable', 'Access Control'],
    defaultParams: {
      name: 'My Token',
      symbol: 'MTK',
      initialSupply: '1000000'
    },
    baseCode: ERC20_BASE
  },
  {
    name: 'NFT Collection',
    description: 'Launch your own NFT collection with ERC721',
    icon: React.createElement(Lightning, { size: 24 }),
    features: ['Minting', 'Metadata Support', 'Access Control', 'Pausable'],
    defaultParams: {
      name: 'My NFT Collection',
      symbol: 'MNFT',
      baseURI: 'ipfs://'
    },
    baseCode: NFT_BASE
  },
  {
    name: 'Custom Contract',
    description: 'Build a custom smart contract from scratch',
    icon: React.createElement(Gear, { size: 24 }),
    features: ['Full Customization', 'AI Assistance', 'Best Practices', 'Security First'],
    baseCode: ''
  }
];