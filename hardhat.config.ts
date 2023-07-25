import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";


const config: HardhatUserConfig = {
  networks: {
    hardhat: {
    },
    localhost: {
      url: 'http://127.0.0.1:8545/',
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: []
    }
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
};

export default config;
