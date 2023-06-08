import {EverWalletAccount} from "everscale-standalone-client";
import { Address } from "locklift";
import BigNumber from "bignumber.js";

async function main() {
  const TokenRootAddress = new Address("0:431f19f8b5c48fba2368e995bd18772e20055900ae1872093fd4c7d563db1919");
  const TokenRoot = locklift.factory.getDeployedContract("TokenRootUpgradeable", TokenRootAddress);

  const { value0: tokenRootDecimals } = await TokenRoot.methods.decimals({answerId: 0}).call({responsible: true})

  const signer = (await locklift.keystore.getSigner("0"))!;

  const collectionMetadata = {
    "type": "Basic Collection",
    "name": "Segmint collection",
    "description": "Image 1000x1000 pixels. 1 000 000 pixels, 1$ per pixel. Own a piece of web3 history!",
    "tags": [
      "history"
    ],
    "preview": {
      "source": "https://segmint-web3.github.io/frontend/collection_logo.png",
      "mimetype": "image/png"
    },
    "banner": {
      "source": "https://segmint-web3.github.io/frontend/collection_logo.png",
      "mimetype": "image/png"
    },
    "files": [
      {
        "source": "https://segmint-web3.github.io/frontend/collection_logo.png",
        "mimetype": "image/png"
      }
    ],
    "external_url": "https://segmint-web3.github.io/frontend/",
    "links": ["https://t.me/"]
  }


  const ownerWallet = await EverWalletAccount.fromPubkey({publicKey: signer.publicKey, workchain: 0});
  locklift.factory.accounts.storage.addAccount(ownerWallet);

  const collectionArtifacts = await locklift.factory.getContractArtifacts("SegmintCollection");
  const nftArtifacts = await locklift.factory.getContractArtifacts("SegmintNft");
  const {address: collectionAddress, stateInit: collectionStateInit} = await locklift.provider.getStateInit(collectionArtifacts.abi, {
    workchain: 0,
    tvc: collectionArtifacts.tvc,
    initParams: {
      owner_: ownerWallet.address,
      nonce_: 1
    }
  })

  const collection = new locklift.provider.Contract(collectionArtifacts.abi, collectionAddress);
  const Index = await locklift.factory.getContractArtifacts("Index");
  const IndexBasis = await locklift.factory.getContractArtifacts("IndexBasis");

  await locklift.tracing.trace(
    collection.methods.constructor({
      codeNft: nftArtifacts.code,
      codeIndex: Index.code,
      codeIndexBasis: IndexBasis.code,
      jsonMetadata: JSON.stringify(collectionMetadata),
      tokenRoot: TokenRootAddress,
      onePixelTokenPrice: new BigNumber(1).shiftedBy(parseInt(tokenRootDecimals)).toString(10)
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
