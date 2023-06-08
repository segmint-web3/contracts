import {zeroAddress} from "locklift";
import BigNumber from "bignumber.js";
import {EverWalletAccount} from "everscale-standalone-client/nodejs";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;

  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});

  const TokenWalletUpgradable = locklift.factory.getContractArtifacts("TokenWalletUpgradeable");
  const TokenRootUpgradeable = locklift.factory.getContractArtifacts("TokenRootUpgradeable");
  const TokenWalletPlatform = locklift.factory.getContractArtifacts("TokenWalletPlatform");


  const initialSupplyTo = zeroAddress;
  const initialSupply = '0';
  const disableMint = false;
  const disableBurnByRoot = false;
  const pauseBurn = false;
  const initialDeployWalletValue = '0';

  const rootOwner = ownerWallet.address;
  const name = "SegminTestUSD";
  const symbol = "TestUSD";
  const decimals = 9;

  const initParams = {
    randomNonce_: '0',
    rootOwner_: rootOwner,
    name_: name,
    symbol_: symbol,
    deployer_: zeroAddress,
    decimals_: decimals,
    walletCode_: TokenWalletUpgradable.code,
    platformCode_: TokenWalletPlatform.code
  }

  const expectedAddress = await locklift.provider.getExpectedAddress(TokenRootUpgradeable.abi, {
    initParams: initParams,
    publicKey: signer.publicKey,
    tvc: TokenRootUpgradeable.tvc
  });

  const account_state = (await locklift.provider.getFullContractState({
    address: expectedAddress
  })).state;

  if (account_state !== undefined && account_state.isDeployed) {
    throw new Error(`TokenRoot is already deployed at ${expectedAddress.toString()}`);
  }

  const { contract: tokenRoot } = await locklift.factory.deployContract({
    contract: "TokenRootUpgradeable",
    publicKey: signer.publicKey,
    initParams: initParams,
    constructorParams: {
      initialSupplyTo: initialSupplyTo,
      initialSupply: new BigNumber(initialSupply).shiftedBy(decimals).toFixed(),
      deployWalletValue: initialDeployWalletValue,
      mintDisabled: disableMint,
      burnByRootDisabled: disableBurnByRoot,
      burnPaused: pauseBurn,
      remainingGasTo: ownerWallet.address,
    },
    value: locklift.utils.toNano(2),
  });

  console.log(`Token root deployed at: ${tokenRoot.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
