import { Address, zeroAddress } from "locklift";
import BigNumber from "bignumber.js";
import {EverWalletAccount} from "everscale-standalone-client/nodejs";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;
  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});
  locklift.factory.accounts.storage.addAccount(ownerWallet);

  const TokenRootAddress = new Address("0:431f19f8b5c48fba2368e995bd18772e20055900ae1872093fd4c7d563db1919");
  const TokenRoot = locklift.factory.getDeployedContract("TokenRootUpgradeable", TokenRootAddress);

  const {state: cachedState} = await TokenRoot.getFullState();

  if (!cachedState || !cachedState.isDeployed) {
    throw new Error('TokeRoot not deployed!');
  }

  const { contract: ProxyOwner } = await locklift.factory.deployContract({
    contract: "ProxyOwner",
    publicKey: signer.publicKey,
    initParams: {
      tokenRoot_: TokenRootAddress
    },
    constructorParams: {},
    value: locklift.utils.toNano(0.5),
  });


  await locklift.tracing.trace(
    TokenRoot.methods.transferOwnership({
      newOwner: ProxyOwner.address,
      remainingGasTo: ownerWallet.address,
      callbacks: []
    }).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1),
    }),
  )

  console.log(`ProxyOwner root deployed at: ${ProxyOwner.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
