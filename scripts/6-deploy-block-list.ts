import {EverWalletAccount, HighloadWalletV2, SimpleKeystore} from "everscale-standalone-client";
import { getRandomTileColors } from "../test/utils";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;
  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});

  const blockListArtifacts = await locklift.factory.getContractArtifacts("BlockList");
  const {address: blockListAddress, stateInit: blockListStateInit} = await locklift.provider.getStateInit(blockListArtifacts.abi, {
    workchain: 0,
    tvc: blockListArtifacts.tvc,
    initParams: {
      owner_: ownerWallet.address
    }
  })


  const blockList = new locklift.provider.Contract(blockListArtifacts.abi, blockListAddress);

  const tracing = await locklift.tracing.trace(
    blockList.methods.constructor({
    }).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1),
      stateInit: blockListStateInit
    })
  );

  console.log(`Block list deployed at: ${blockList.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
