import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_LOVELOCK_PACKAGE_ID,
  TESTNET_LOVELOCK_PACKAGE_ID,
  MAINNET_LOVELOCK_PACKAGE_ID,
  DEVNET_BRIDGE_OBJECT_ID,
  TESTNET_BRIDGE_OBJECT_ID,
  MAINNET_BRIDGE_OBJECT_ID
} from "./constants";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        lovelockPackageId: DEVNET_LOVELOCK_PACKAGE_ID,
        bridgeObjectId: DEVNET_BRIDGE_OBJECT_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        lovelockPackageId: TESTNET_LOVELOCK_PACKAGE_ID,
        bridgeObjectId: TESTNET_BRIDGE_OBJECT_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        lovelockPackageId: MAINNET_LOVELOCK_PACKAGE_ID,
        bridgeObjectId: MAINNET_BRIDGE_OBJECT_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
