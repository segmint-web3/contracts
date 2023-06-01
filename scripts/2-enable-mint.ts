import {EverWalletAccount} from "everscale-standalone-client";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;

  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});

  const collectionArtifacts = await locklift.factory.getContractArtifacts("SegmintCollection");
  const nftArtifacts = await locklift.factory.getContractArtifacts("SegmintNft");
  const {address: collectionAddress, stateInit: collectionStateInit} = await locklift.provider.getStateInit(collectionArtifacts.abi, {
    workchain: 0,
    tvc: collectionArtifacts.tvc,
    initParams: {
      owner_: ownerWallet.address,
      nonce_: 0
    }
  })

  const collection = new locklift.provider.Contract(collectionArtifacts.abi, collectionAddress);
  const {state: cachedState} = await collection.getFullState();

  if (!cachedState) {
    throw new Error('Collection not deployed!');
  }

  await locklift.tracing.trace(
    collection.methods.enableMint({answerId: 0}).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1),
    }),
  )

  console.log(`Mint enabled at: ${collection.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
