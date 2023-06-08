import chai, { expect } from "chai";
import { Contract, lockliftChai } from "locklift";
chai.use(lockliftChai);

import { Signer } from "locklift";
import { EverWalletAccount, SimpleKeystore } from "everscale-standalone-client";
import { deployCollectionForOwner, getRandomTileColors, metadata } from "./utils";
import { FactorySource } from "../build/factorySource";

let signer: Signer;
let ownerEverWallet: EverWalletAccount;

let collection: Contract<FactorySource["SegmintCollection"]>;
let nft: Contract<FactorySource["SegmintNft"]>;

describe("Test nft", async function () {
  before(async () => {
    let randKeypair = SimpleKeystore.generateKeyPair();
    await locklift.keystore.addKeyPair("random", randKeypair);
    signer = (await locklift.keystore.getSigner("random"))!;
    ownerEverWallet = await EverWalletAccount.fromPubkey({publicKey: randKeypair.publicKey});
    await locklift.giver.sendTo(ownerEverWallet.address, locklift.utils.toNano(50))
    await locklift.factory.accounts.storage.addAccount(ownerEverWallet);
  });

  describe("Contracts", async function () {
    it("Load contract factory", async function () {
      for (let contract of ['Index', 'IndexBasis', 'SegmintCollection', 'SegmintNft']) {
        const artifacts = await locklift.factory.getContractArtifacts("SegmintCollection");
        expect(artifacts.code).not.to.equal(undefined, "Code should be available");
        expect(artifacts.abi).not.to.equal(undefined, "ABI should be available");
        expect(artifacts.tvc).not.to.equal(undefined, "tvc should be available");
      }
    });

    it("Deploy collection & nft", async function () {
      collection = await deployCollectionForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true);
      // expect(Number(response._state)).to.be.equal(NEW_STATE, "Wrong state");
      const tracing = await locklift.tracing.trace(
        collection.methods.claimTiles({
          "pixelStartX": 0,
          "pixelStartY": 0,
          "pixelEndX": 10,
          "pixelEndY": 10,
          "tilesToColorify": [getRandomTileColors()],
          "description": "no",
          "url": "no",
          "coinsToRedrawOneTile" : locklift.utils.toNano(0.3)
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(10),
        })
      );

      let {nft: nftAddress} = await collection.methods.nftAddress({answerId: 0, id: "0"}).call({responsible: true});
      nft = locklift.factory.getDeployedContract('SegmintNft', nftAddress);
      let { state } = await nft.getFullState();
      expect(state?.isDeployed).to.be.true;

      let { id, owner, manager, collection: collectionAddress } = await nft.methods.getInfo({answerId: 0}).call({responsible: true});
      expect(id).to.be.equal('0');
      expect(owner.toString()).to.be.equal(ownerEverWallet.address.toString());
      expect(manager.toString()).to.be.equal(ownerEverWallet.address.toString());
      expect(collectionAddress.toString()).to.be.equal(collection.address.toString());
    });

    it("TIP6 test", async function () {
      /// ITIP6
      let response = await nft.methods.supportsInterface({answerId: 0, interfaceID: "0x3204EC29"}).call();
      expect(response.value0).to.be.equal(true);

      // TIP4_1
      response = await nft.methods.supportsInterface({answerId: 0, interfaceID: "0x78084F7E"}).call();
      expect(response.value0).to.be.equal(true);

      // TIP4_2
      response = await collection.methods.supportsInterface({answerId: 0, interfaceID: "0x24D7D5F5"}).call();
      expect(response.value0).to.be.equal(true);

      // TIP4_3
      response = await nft.methods.supportsInterface({answerId: 0, interfaceID: "0x4DF6250B"}).call();
      expect(response.value0).to.be.equal(true);
    });

    it ("Get nft json", async function() {
      // const json = await nft.methods.getJson({answerId: 0}).call({responsible: true});
      // console.log(json);
    })

    it("Only manager must be able to transfer nft", async function () {
      const newOwnerKeypair = SimpleKeystore.generateKeyPair();
      await locklift.keystore.addKeyPair(newOwnerKeypair);
      const newOwnerEverWallet = await EverWalletAccount.fromPubkey({publicKey: newOwnerKeypair.publicKey});
      await locklift.factory.accounts.storage.addAccount(newOwnerEverWallet);
      await locklift.giver.sendTo(newOwnerEverWallet.address, locklift.utils.toNano(10))

      await locklift.tracing.trace(
        nft.methods.transfer({
          to: newOwnerEverWallet.address,
          sendGasTo: newOwnerEverWallet.address,
          callbacks: []
        }).send({
          from: newOwnerEverWallet.address,
          amount: locklift.utils.toNano(3)
        }), {
          allowedCodes: {
            contracts: {
              [nft.address.toString()]: {
                compute: [103],
              },
            },
          },
        })

      let { owner: currentOwner, manager: currentManager } = await nft.methods.getInfo({answerId: 0}).call({responsible: true});
      expect(currentOwner.equals(ownerEverWallet.address)).to.be.true;
      expect(currentManager.equals(ownerEverWallet.address)).to.be.true;

      await locklift.tracing.trace(
        nft.methods.transfer({
          to: newOwnerEverWallet.address,
          sendGasTo: newOwnerEverWallet.address,
          callbacks: []
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(3)
        })
      )

      let { owner: newOwner, manager: newManager } = await nft.methods.getInfo({answerId: 0}).call({responsible: true});
      expect(newOwner.equals(newOwnerEverWallet.address)).to.be.true;
      expect(newManager.equals(newOwnerEverWallet.address)).to.be.true;

      await locklift.tracing.trace(
        nft.methods.transfer({
          to: ownerEverWallet.address,
          sendGasTo: ownerEverWallet.address,
          callbacks: []
        }).send({
          from: newOwnerEverWallet.address,
          amount: locklift.utils.toNano(3)
        })
      )
      let { owner: oldOwnerAgain, manager: oldManagerAgain } = await nft.methods.getInfo({answerId: 0}).call({responsible: true});
      expect(oldOwnerAgain.equals(ownerEverWallet.address)).to.be.true;
      expect(oldManagerAgain.equals(ownerEverWallet.address)).to.be.true;
    });
  });
});
