import {EverWalletAccount} from "everscale-standalone-client";
import { WalletTypes } from "locklift";

async function main() {
  const nonce = 0;
  const signer = (await locklift.keystore.getSigner("0"))!;

  const collectionMetadata = {
    "type": "Basic Collection",
    "name": "Segmint collection",
    "description": "Introducing the unique NFT collection Segmint, an innovative project where advertising meets art and blockchain, creating an exciting world of interactive creativity.",
    "tags": [
      "history"
    ],
    "preview": {
      "source": "https://segmint.app/collection_logo.png",
      "mimetype": "image/png"
    },
    "banner": {
      "source": "https://segmint.app/collection_banner.png",
      "mimetype": "image/png"
    },
    "files": [
      {
        "source": "https://segmint.app/collection_logo.png",
        "mimetype": "image/png"
      }
    ],
    "external_url": "https://segmint.app/",
    "links": ["https://segmint.app/"]
  }

  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});
  const collectionArtifacts = await locklift.factory.getContractArtifacts("SegmintCollection");
  const nftArtifacts = await locklift.factory.getContractArtifacts("SegmintNft");

  const {address: collectionAddress, stateInit: collectionStateInit} = await locklift.provider.getStateInit(collectionArtifacts.abi, {
    workchain: 0,
    tvc: collectionArtifacts.tvc,
    initParams: {
      owner_: ownerWallet.address,
      nonce_: nonce
    }
  });

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
      from: ownerWallet.address,
      amount: locklift.utils.toNano(3),
      stateInit: collectionStateInit
    })
  );

  await locklift.tracing.trace(
    collection.methods.enableMint({answerId: 0}).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1),
    }),
  )

  const blockListArtifacts = await locklift.factory.getContractArtifacts("BlockList");
  const {address: blockListAddress, stateInit: blockListStateInit} = await locklift.provider.getStateInit(blockListArtifacts.abi, {
    workchain: 0,
    tvc: blockListArtifacts.tvc,
    initParams: {
      nonce_: nonce,
      owner_: ownerWallet.address
    }
  })

  const blockList = new locklift.provider.Contract(blockListArtifacts.abi, blockListAddress);
  await locklift.tracing.trace(
    blockList.methods.constructor({}).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1),
      stateInit: blockListStateInit
    })
  );

  await locklift.tracing.trace(
    collection.methods.changeManager({newManager: blockListAddress}).send({
      from: ownerWallet.address,
      amount: locklift.utils.toNano(1),
    }),
  )

  console.log(`Collection deployed at: ${collection.address.toString()} minting enabled`);
  console.log(`Blocklist deployed at: ${blockList.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
