import {EverWalletAccount, HighloadWalletV2, SimpleKeystore} from "everscale-standalone-client";
import { getRandomTileColors } from "../test/utils";

async function main() {
  const nftId = '0';

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


  const collectionArtifacts = await locklift.factory.getContractArtifacts("SegmintCollection");
  const {address: collectionAddress, stateInit: collectionStateInit} = await locklift.provider.getStateInit(collectionArtifacts.abi, {
    workchain: 0,
    tvc: collectionArtifacts.tvc,
    initParams: {
      owner_: ownerWallet.address,
      nonce_: 0
    }
  })
  const collection = new locklift.provider.Contract(collectionArtifacts.abi, collectionAddress);

  await locklift.tracing.trace(
    collection.methods.setNftBurningBlocked({nftId: nftId, isBlocked: true}).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1)
    })
  );

  await locklift.tracing.trace(
    blockList.methods.addToBanList({
      nftId: nftId,
    }).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1),
    })
  );

  console.log(`Nft banned`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
