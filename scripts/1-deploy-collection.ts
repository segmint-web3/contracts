import {EverWalletAccount} from "everscale-standalone-client";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;

  const collectionMetadata = {
    "type": "Basic Collection",
    "name": "SegMint collection",
    "description": "Image 1000x1000 pixels. 1 000 000 pixels, 1$ per pixel. Own a piece of web3 history!",
    "tags": [
      "history"
    ],
    "preview": {
      "source": "https://segmint/preview.png",
      "mimetype": "image/png"
    },
    "banner": {
      "source": "https://segmint/banner.png",
      "mimetype": "image/png"
    },
    "files": [
      {
        "source": "https://segmint/main.png",
        "mimetype": "image/png"
      }
    ],
    "external_url": "",
    "links": ["https://t.me/"]
  }


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

  console.log(`Collection deployed at: ${collection.address.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
