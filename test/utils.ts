import {Contract} from "locklift";
import {FactorySource} from "../build/factorySource";
import { BN } from "bn.js";
import { EverWalletAccount } from "everscale-standalone-client";

const collectionMetadata = {test: true};
export function metadata() {
    return collectionMetadata;
}
export async function deployCollectionForOwner(ownerEverWallet: EverWalletAccount, nonce: number, enableMint: bool) : Promise<Contract<FactorySource["SegmintCollection"]>> {
  const collectionArtifacts = await locklift.factory.getContractArtifacts("SegmintCollection");
  const nftArtifacts = await locklift.factory.getContractArtifacts("SegmintNft");
  const {address: collectionAddress, stateInit: collectionStateInit} = await locklift.provider.getStateInit(collectionArtifacts.abi, {
    workchain: 0,
    tvc: collectionArtifacts.tvc,
    initParams: {
      owner_: ownerEverWallet.address,
      nonce_: nonce
    }
  })

  const collection = new locklift.provider.Contract(collectionArtifacts.abi, collectionAddress);
  const Index = await locklift.factory.getContractArtifacts("Index");
  const IndexBasis = await locklift.factory.getContractArtifacts("IndexBasis");


  const tracing = await locklift.tracing.trace(
    collection.methods.constructor({
      codeNft: nftArtifacts.code,
      codeIndex: Index.code,
      codeIndexBasis: IndexBasis.code,
      jsonMetadata: JSON.stringify(collectionMetadata)
    }).send({
      from: ownerEverWallet.address,
      amount: locklift.utils.toNano(3),
      stateInit: collectionStateInit
    })
  )

  if (enableMint) {
    await locklift.tracing.trace(
      collection.methods.enableMint({answerId: 0}).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(1),
      }),
    )
  }
  return collection
}
export function getRandomTileColors() {
  let pixels = [];
  for (let y = 0; y < 10; y ++) {
    for (let x = 0; x < 10; x++) {
      pixels.push(Math.floor(Math.random() * 255))
      pixels.push(Math.floor(Math.random() * 255))
      pixels.push(Math.floor(Math.random() * 255))
      pixels.push(Math.floor(Math.random() * 255))
    }
  }
  return encodePixelsToTileColor(pixels);
}

function encodePixelsToTileColor(pixels: number[]) {
  const tileColor = {
    r: [],
    b: [],
    g: []
  }
  for (let y = 0; y < 10; y++) {
    let r = new BN('0', 10);
    let g = new BN('0', 10);
    let b = new BN('0', 10);
    for (let x = 0; x < 10; x++) {
      r = r.shln(x === 0 ? 0 : 8).or(new BN(pixels[(x * 4 + 0)  + y * 10 * 4].toString(10), 10))
      g = g.shln( x === 0 ? 0 : 8).or(new BN(pixels[(x * 4 + 1)  + y * 10 * 4].toString(10), 10))
      b = b.shln( x === 0 ? 0 : 8).or(new BN(pixels[(x * 4 + 2)  + y * 10 * 4].toString(10), 10))
    }
    tileColor.r.push(r.toString(10))
    tileColor.g.push(g.toString(10))
    tileColor.b.push(b.toString(10))
  }
  return tileColor;
}
