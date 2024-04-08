import {EverWalletAccount, HighloadWalletV2, SimpleKeystore} from "everscale-standalone-client";
import { getRandomTileColors } from "../test/utils";
import { Address } from "locklift";
import { checkIsDeployed, checkIsOwner } from "./utils";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;

  const collectionAddress = new Address("0:f3806c25134f5642489693be9d7bb8d2770619e99f558d81c031b77e5faf9f83")
  const blockListAddress = new Address("0:a32817871fb83d54eb649c22371d23a36901ae96d2c420b812917766274e0653")
  await checkIsDeployed(collectionAddress, locklift.provider);
  await checkIsDeployed(blockListAddress, locklift.provider);

  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});

  // const collection = locklift.factory.getDeployedContract('SegmintCollection', collectionAddress);
  const blockList = locklift.factory.getDeployedContract('BlockList', blockListAddress);

  await locklift.tracing.trace(
    blockList.methods.removeFromBanList({
      collection: collectionAddress,
      nftId: '151305',
    }).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1),
    })
  );

  console.log(`Nft unbanned`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
