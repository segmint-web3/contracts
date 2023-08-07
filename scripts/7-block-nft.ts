import {EverWalletAccount, HighloadWalletV2, SimpleKeystore} from "everscale-standalone-client";
import { getRandomTileColors } from "../test/utils";
import { Address } from "locklift";
import { checkIsDeployed, checkIsOwner } from "./utils";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;

  const collectionAddress = new Address("0:4b36b511062235e566fc04b1d8349843bc34103ea7be3b8131268838d6155b9d")
  const blockListAddress = new Address("0:4b36b511062235e566fc04b1d8349843bc34103ea7be3b8131268838d6155b9d")
  await checkIsDeployed(collectionAddress, locklift.provider);
  await checkIsDeployed(blockListAddress, locklift.provider);

  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});

  const collection = locklift.factory.getDeployedContract('SegmintCollection', collectionAddress);
  const blockList = locklift.factory.getDeployedContract('BlockList', blockListAddress);

  await locklift.tracing.trace(
    blockList.methods.addToBanList({
      collection: collectionAddress,
      nftId: '0',
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
