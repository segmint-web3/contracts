import { EverWalletAccount } from "everscale-standalone-client/nodejs";
import { Address, WalletTypes } from "locklift";
import { bufferToBytesArray, checkIsDeployed, parseTilesToField } from "./utils";
import fs from "fs";
import { PNG } from "pngjs";

const MaximumFwdFeeForBigMint = 1.5; // for venom 0.15;
const OneNftMintingCost = 1; // for venom 0.8;
const MaximumClaimGasPrice = 1; // for venom  0.15;


async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;
  const highloadKeys = (await locklift.keystore.getSigner("1"))!;
  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});
  const highloadWallet = ownerWallet;
  // const {account: highloadWallet} = await locklift.factory.accounts.addNewAccount({
  //   type: WalletTypes.HighLoadWalletV2,
  //   publicKey: highloadKeys.publicKey,
  //   value: locklift.utils.toNano(500),
  // })

  const collectionAddress = new Address("0:f3806c25134f5642489693be9d7bb8d2770619e99f558d81c031b77e5faf9f83")
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

  let promises = [];
  let space_occupied = 0;
  let last_images = [];
  while (true) {
    let image_name = images[Math.floor(images.length * Math.random())];
    if (last_images.length > 20) {
      last_images.shift();
    }
    if (last_images.indexOf(image_name) !== -1) {
      console.log('skip', image_name);
      continue;
    }
    if (!image_name.startsWith('maze'))
      last_images.push(image_name);

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
    let mintTx;
    for (let tX = 0; tX <= 50 - imageTileWidth; tX++) {
      for (let tY = 0; tY <= 50 - imageTileHeight; tY++) {
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
          mintTx = collection.methods.claimTiles({
            "tileStartX": tX,
            "tileStartY": tY,
            "tileEndX": tX + imageTileWidth,
            "tileEndY": tY + imageTileHeight,
            "tilesToColorify": bytesArray,
            "description": image_name,
            "url": 'https://google.com',
          }).send({
            from: highloadWallet.address,
            amount: Math.floor(((imageTileWidth) * (imageTileHeight)) * (parseInt(parsedState.currentEpochTilePrice_) + parseInt(parsedState.epochTilePriceGrow_)) + (MaximumFwdFeeForBigMint + OneNftMintingCost + MaximumClaimGasPrice) * 1_000_000_000).toString(),
          })
          for (let addX = 0; addX < imageTileWidth; addX++) {
            for (let addY = 0; addY < imageTileHeight; addY++) {
              let index = (tX + addX) * 50 + tY + addY;
              field[index].claimedInEpoch = parseInt(parsedState.currentEpoch_);
            }
          }
          await new Promise(resolve => setTimeout(resolve, 5000));
          break;
        }
      }
      if (found) {
        break
      }
    }
    if (!mintTx) {
      space_occupied++
      if (space_occupied > 300) {
        console.log('All space occupied!')
        break;
      }
    } else {
      space_occupied = 0;
      // promises.push(mintTx);
      // if (promises.length >= 50) {
      //   console.log('Minting 50 images! Stop to clean up highload wallet');
      //   break;
      // }
    }
  }
  // await Promise.all(promises);
  let balance = await locklift.provider.getBalance(highloadWallet.address);
  await locklift.provider.sendMessage(
    {
      sender: highloadWallet.address,
      recipient: ownerWallet.address,
      amount: (parseInt(balance) - 100_000_000).toString(),
      bounce: false
    })
  await new Promise((resolve) => setTimeout(resolve, 10000));
  console.log(highloadWallet.address.toString(), await locklift.provider.getBalance(highloadWallet.address));
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
