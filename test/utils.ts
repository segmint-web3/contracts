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
export function getRandomTileColors(r: number | undefined, g: number | undefined, b: number | undefined) {
  let pixels = [];
  for (let y = 0; y < 20; y ++) {
    for (let x = 0; x < 20; x++) {
      pixels.push(r !== undefined ? r : Math.floor(Math.random() * 255))
      pixels.push(g !== undefined ? g : Math.floor(Math.random() * 255))
      pixels.push(b !== undefined ? b : Math.floor(Math.random() * 255))
      pixels.push(255)
    }
  }
  return encodePixelsToTileColor(pixels);
}

function encodePixelsToTileColor(pixels: number[]) {
  return Buffer.from(pixels.filter(p => (pixels.indexOf(p) + 1) % 4 !== 0)).toString('base64');
}
