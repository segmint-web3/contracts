import {EverWalletAccount} from "everscale-standalone-client";
import { Address } from "locklift";
import { checkIsOwner } from "./utils";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;
  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});

  const collectionAddress = new Address("0:f3806c25134f5642489693be9d7bb8d2770619e99f558d81c031b77e5faf9f83")
  const collection = locklift.factory.getDeployedContract('SegmintCollection', collectionAddress);

  console.log(await collection.methods.nftCode({answerId: 0}).call({
    responsible: true
  }))

}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
