import { Contract, zeroAddress } from "locklift";
import {FactorySource} from "../build/factorySource";
import { BN } from "bn.js";
import { EverWalletAccount } from "everscale-standalone-client";
import BigNumber from "bignumber.js";

const collectionMetadata = {test: true};
export function metadata() {
    return collectionMetadata;
}
export async function deployCollectionAndTokenForOwner(ownerEverWallet: EverWalletAccount, nonce: number, enableMint: boolean, initial_supply_tokens: number) : Promise<{collection: Contract<FactorySource["SegmintCollection"]>, tokenRoot: Contract<FactorySource["TokenRootUpgradeable"]>, tokenWallet: Contract<FactorySource["TokenWalletUpgradeable"]>}> {
  const signer = (await locklift.keystore.getSigner("0"))!;

  const TokenWalletUpgradable = locklift.factory.getContractArtifacts("TokenWalletUpgradeable");
  const TokenRootUpgradeable = locklift.factory.getContractArtifacts("TokenRootUpgradeable");
  const TokenWalletPlatform = locklift.factory.getContractArtifacts("TokenWalletPlatform");

  const disableMint = false;
  const disableBurnByRoot = false;
  const pauseBurn = false;
  const initialDeployWalletValue = locklift.utils.toNano(0.15);

  const rootOwner = ownerEverWallet.address;
  const name = "SegminTestUSD";
  const symbol = "TestUSD";
  const decimals = 9;

  const initParams = {
    randomNonce_: nonce,
    rootOwner_: rootOwner,
    name_: name,
    symbol_: symbol,
    deployer_: zeroAddress,
    decimals_: decimals,
    walletCode_: TokenWalletUpgradable.code,
    platformCode_: TokenWalletPlatform.code
  }

  const expectedTokenRootAddress = await locklift.provider.getExpectedAddress(TokenRootUpgradeable.abi, {
    initParams: initParams,
    publicKey: signer.publicKey,
    tvc: TokenRootUpgradeable.tvc
  });

  const account_state = (await locklift.provider.getFullContractState({
    address: expectedTokenRootAddress
  })).state;

  if (account_state !== undefined && account_state.isDeployed) {
    throw new Error(`TokenRoot is already deployed at ${expectedTokenRootAddress.toString()}`);
  }


  // Deploy token root
  const { contract: tokenRoot } = await locklift.factory.deployContract({
    contract: "TokenRootUpgradeable",
    publicKey: signer.publicKey,
    initParams: initParams,
    constructorParams: {
      initialSupplyTo: ownerEverWallet.address,
      initialSupply: new BigNumber(initial_supply_tokens).shiftedBy(decimals).toFixed(),
      deployWalletValue: initial_supply_tokens !== 0 ? initialDeployWalletValue : 0,
      mintDisabled: disableMint,
      burnByRootDisabled: disableBurnByRoot,
      burnPaused: pauseBurn,
      remainingGasTo: ownerEverWallet.address,
    },
    value: locklift.utils.toNano(2),
  });

  // deploy token wallet if initial supply no
  if (initial_supply_tokens === 0) {
    await locklift.tracing.trace(
      tokenRoot.methods.deployWallet({
        answerId: 0,
        walletOwner: ownerEverWallet.address,
        deployWalletValue: locklift.utils.toNano(0.1),
      }).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(1)
      })
    )
  }

  // get token wallet contract
  const {value0: walletAddress} = await tokenRoot.methods.walletOf({answerId: 0, walletOwner: ownerEverWallet.address}).call({responsible: true});
  const tokenWallet = await locklift.factory.getDeployedContract('TokenWalletUpgradeable', walletAddress);

  // deploy collection
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
      jsonMetadata: JSON.stringify(collectionMetadata),
      tokenRoot: tokenRoot.address,
      onePixelTokenPrice: new BigNumber(1).shiftedBy(decimals).toFixed()
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

  return {collection, tokenRoot, tokenWallet}
}
export function getRandomTileColors() : tileToColorify {
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

function encodePixelsToTileColor(pixels: number[]) : tileToColorify {
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

type tileToColorify ={
  r: string[];
  g: string[];
  b: string[];
}

type mintPayload = {
  pixelStartX: number;
  pixelStartY: number;
  pixelEndX: number;
  pixelEndY: number;
  tilesToColorify: tileToColorify[];
  description: string;
  url: string;
  coinsToRedrawOneTile: string
}

export async function encodeMintPayload(payload: mintPayload) : Promise<string> {
  return (await locklift.provider.packIntoCell({
    data: {
      pixelStartX: payload.pixelStartX,
      pixelStartY: payload.pixelStartY,
      pixelEndX: payload.pixelEndX,
      pixelEndY: payload.pixelEndY,
      tilesToColorify: payload.tilesToColorify,
      description: payload.description,
      url: payload.url,
      coinsToRedrawOneTile: payload.coinsToRedrawOneTile
    },
    structure: [
      {name: 'pixelStartX', type: 'uint10'},
      {name: 'pixelStartY', type: 'uint10'},
      {name: 'pixelEndX', type: 'uint10'},
      {name: 'pixelEndY', type: 'uint10'},
      {"components":[{"name":"r","type":"uint80[]"},{"name":"g","type":"uint80[]"},{"name":"b","type":"uint80[]"}],"name":"tilesToColorify","type":"tuple[]"},
      {name: 'description', type: 'string'},
      {name: 'url', type: 'string'},
      {name: 'coinsToRedrawOneTile', type: 'uint128'}
    ] as const,
  })).boc;
}
