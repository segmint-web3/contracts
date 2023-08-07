import {EverWalletAccount} from "everscale-standalone-client";
import { Address } from "locklift";
import { bufferToBytesArray, checkIsDeployed, parseTilesToField } from "./utils";
import fs from 'fs';
import {PNG} from 'pngjs';

const MaximumFwdFeeForBigMint = 1.5; // for venom 0.15;
const OneNftMintingCost = 1; // for venom 0.8;
const MaximumClaimGasPrice = 1; // for venom  0.15;


async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;
  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});

  const collectionAddress = new Address("0:4b36b511062235e566fc04b1d8349843bc34103ea7be3b8131268838d6155b9d")
  const collection = locklift.factory.getDeployedContract('SegmintCollection', collectionAddress);
  await checkIsDeployed(collectionAddress, locklift.provider);

  const {state: cachedState} = await collection.getFullState();
  if (!cachedState) {
    throw new Error('Collection not deployed!');
  }

  const {fields: parsedState} = await collection.getFields({cachedState: cachedState});
  let field = parseTilesToField(parsedState.tiles_);

  let images = fs.readdirSync(__dirname + '/images/').filter(file => file.slice(-4) === '.png');
  if (images.length === 0)
    throw new Error('Image not found');

  let image_name = images[Math.floor(images.length * Math.random())];
  let data = fs.readFileSync(`${__dirname}/images/${image_name}`);
  let png = PNG.sync.read(data);
  if (png.width % 20 !== 0 || png.height % 20 !== 0) {
    throw new Error(`Fail to mint image with name ${image_name} because width or height is not divisible by 20. Resizing not realized in this script.`)
  }

  let bytesArray = bufferToBytesArray(png.data, png.width, png.height);

  let imageTileWidth = png.width / 20;
  let imageTileHeight = png.height / 20;

  // search for good place for this image.
  // stupid search
  let found = false;
  let tracing;
  for (let tX = 0; tX < 50 - imageTileWidth; tX++) {
    for (let tY = 0; tY < 50 - imageTileHeight; tY++) {
      let stopped = false;
      for (let addX = 0; addX < imageTileWidth; addX++) {
        for (let addY = 0; addY < imageTileHeight; addY++) {
          let index = (tX + addX) * 50 + tY + addY;
          if (field[index].claimedInEpoch === parseInt(parsedState.currentEpoch_)) {
            stopped = true;
            break;
          }
        }
        if (stopped)
          break;
      }
      if (!stopped) {
        found = true;
        console.log('Try to ming', image_name, 'x', tX * 20, 'y', tY * 20);
        tracing = await locklift.tracing.trace(collection.methods.claimTiles({
          "tileStartX": tX,
          "tileStartY": tY,
          "tileEndX": tX + imageTileWidth,
          "tileEndY": tY + imageTileHeight,
          "tilesToColorify": bytesArray,
          "description": image_name,
          "url": 'https://segmint.app',
        }).send({
          from: ownerWallet.address,
          amount: Math.floor( ((imageTileWidth) * (imageTileHeight)) * (parseInt(parsedState.currentEpochTilePrice_) + parseInt(parsedState.epochTilePriceGrow_)) + (MaximumFwdFeeForBigMint + OneNftMintingCost + MaximumClaimGasPrice) * 1_000_000_000).toString(),
        }))
        break;
      }
    }
    if (found) {
      break
    }
  }
  if (tracing) {
    console.log(tracing.traceTree?.findEventsForContract({
      contract: collection,
      name: "NftMinted" as const,
    }).length > 0 ? 'Nft minted' : 'Nft not minted');
  } else {
    console.log('Space not found!')
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
