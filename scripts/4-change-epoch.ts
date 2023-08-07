import {EverWalletAccount} from "everscale-standalone-client";
import { Address } from "locklift";
import { checkIsOwner } from "./utils";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;
  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});

  const collectionAddress = new Address("0:4b36b511062235e566fc04b1d8349843bc34103ea7be3b8131268838d6155b9d")
  const collection = locklift.factory.getDeployedContract('SegmintCollection', collectionAddress);
  await checkIsOwner(collection, ownerWallet.address);

  await locklift.tracing.trace(
    collection.methods.changeEpoch({answerId: 0}).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1),
    }),
  )
  console.log(`Epoch changed: ${collection.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
