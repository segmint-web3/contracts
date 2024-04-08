import {EverWalletAccount} from "everscale-standalone-client";
import { Address, WalletTypes } from "locklift";
import { checkIsOwner } from "./utils";

async function main() {
  const nonce = 1;
  const signer = (await locklift.keystore.getSigner("0"))!;

  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});
  const kingOfSegmintArtifacts = await locklift.factory.getContractArtifacts("KingOfSegmint");

  const collectionAddress = new Address("0:f3806c25134f5642489693be9d7bb8d2770619e99f558d81c031b77e5faf9f83")
  const collection = locklift.factory.getDeployedContract('SegmintCollection', collectionAddress);
  await checkIsOwner(collection, ownerWallet.address);

  const {address: kingAddress, stateInit: kingStateInit} = await locklift.provider.getStateInit(kingOfSegmintArtifacts.abi, {
    workchain: 0,
    tvc: kingOfSegmintArtifacts.tvc,
    initParams: {
      owner_: ownerWallet.address,
      segmintCollection_: collectionAddress,
      nonce_: nonce
    }
  });

  const kingContract = new locklift.provider.Contract(kingOfSegmintArtifacts.abi, kingAddress);

  await locklift.tracing.trace(
    kingContract.methods.constructor({
      roundNumber: nonce,
      needToHoldTime: 60 * 5
    }).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1),
      stateInit: kingStateInit
    })
  );

  console.log(`KingOfSegmit deployed at: ${kingAddress.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
