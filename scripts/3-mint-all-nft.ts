import {EverWalletAccount, HighloadWalletV2, SimpleKeystore} from "everscale-standalone-client";

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
  console.log('collection address', collection.address.toString());

  for (let x = 0; x < 100; x++) {
    for (let y = 0; y < 100; y++) {
      console.log('mint', x, y,);
      const tile = await collection.methods.getTile({tilePixelX: x * 10, tilePixelY: y * 10, answerId: 0}).call({responsible: true, cachedState: cachedState});
      //already minted
      if (tile.nftId !== '4294967295')
        continue

      await collection.methods.claimTiles({
        "pixelStartX": x * 10,
        "pixelStartY": y * 10,
        "pixelEndX": x * 10 + 10,
        "pixelEndY": y * 10 + 10,
        "tilesToColorify": [
          {
            r: [0,0,0,0,0,0,0,0,0,0],
            g: [0,0,0,0,0,0,0,0,0,0],
            b: [0,0,0,0,0,0,0,0,0,0],
          }
        ],
        "description": `Test mint ${x},${y}`,
        "url": "https://google.com/"
      }).send({
        from: ownerWallet.address,
        amount: locklift.utils.toNano(5),
      })
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
