import {EverWalletAccount, HighloadWalletV2, SimpleKeystore} from "everscale-standalone-client";
import { getRandomTileColors } from "../test/utils";

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

  for (let y = 0; y < 100; y++) {
    console.log('mint', y);
    //already minted
    const tile = await collection.methods.getTile({tilePixelX: 0, tilePixelY: y * 10, answerId: 0}).call({responsible: true, cachedState: cachedState});
    // if (tile.nftId !== '429496729')
    //   continue

    let pixels = [];
    for (let i = 0; i < 100; i++)
      pixels.push(getRandomTileColors(0, 0, 255))

    try {
      await collection.methods.claimTiles({
        "pixelStartX": 0,
        "pixelStartY": y * 10,
        "pixelEndX": 1000,
        "pixelEndY": y * 10 + 10,
        "tilesToColorify": pixels,
        "description": `Test mint ${Math.random()}`,
        "url": "https://google.com/",
        "coinsToRedrawOneTile" : locklift.utils.toNano(0.15)
      }).send({
        from: ownerWallet.address,
        amount: locklift.utils.toNano(80),
      })
    } catch (e) {
      console.log(e);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
