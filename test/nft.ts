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
      const {json} = await nft.methods.getJson({answerId: 0}).call({responsible: true});
      expect(json).to.be.equal('{"type":"Basic NFT","name":"Segmint Nft 0","description":"Piece of canvas x from 0 to 10, y from 0 to 10 pixels","preview":{"source":"https://segmint.app/collection_logo.png","mimetype":"image/png"},"files":[{"source":"https://segmint.app/collection_logo.png","mimetype":"image/png"}],"external_url":"https://segmint.app/"}');
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

  it("Partially reclaimed nft must not be burnable. Full Reclaimed must be burnable.", async function () {
    let tracing;
    const collection = await deployCollectionForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true);

    // Claim 10x20 pixels tile.
    await locklift.tracing.trace(
      collection.methods.claimTiles({
        "pixelStartX": 0,
        "pixelStartY": 0,
        "pixelEndX": 10,
        "pixelEndY": 20,
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

    // change epoch to reclaim
    await locklift.tracing.trace(
      collection.methods.changeEpoch({answerId: 0}).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(1),
      })
    );

    // Claim 10x10 from 10x20, 1/2.
    await locklift.tracing.trace(
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

    await locklift.tracing.trace(
      nft.methods.burnNft({}).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(1.1),
      })
    );
    expect((await nft.getFullState()).state?.isDeployed).to.be.equal(true);

    // claim second tile of the first nft.
    await locklift.tracing.trace(
      collection.methods.claimTiles({
        "pixelStartX": 0,
        "pixelStartY": 10,
        "pixelEndX": 10,
        "pixelEndY": 20,
        "tilesToColorify": [getRandomTileColors()],
        "description": "no",
        "url": "no",
        "coinsToRedrawOneTile" : locklift.utils.toNano(0.3)
      }).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(10),
      })
    );

    await locklift.tracing.trace(
      nft.methods.burnNft({}).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(1.1),
      })
    );
    // must be deleted
    expect((await nft.getFullState()).state).to.be.equal(undefined);
  });

  it("Collection owner can lock nft from be burned in case of unappropriated content.", async function () {
    let tracing;
    const collection = await deployCollectionForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true);

    // Claim 10x20 pixels tile.
    await locklift.tracing.trace(
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

    // change epoch to reclaim
    await locklift.tracing.trace(
      collection.methods.changeEpoch({answerId: 0}).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(1),
      })
    );

    // Redraw
    await locklift.tracing.trace(
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


    // claim second tile of the first nft.
    await locklift.tracing.trace(
      collection.methods.claimTiles({
        "pixelStartX": 0,
        "pixelStartY": 10,
        "pixelEndX": 10,
        "pixelEndY": 20,
        "tilesToColorify": [getRandomTileColors()],
        "description": "no",
        "url": "no",
        "coinsToRedrawOneTile" : locklift.utils.toNano(0.3)
      }).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(10),
      })
    );


    // block
    await locklift.tracing.trace(
      collection.methods.setNftBurningBlocked({
        "nftId": "0",
        "isBlocked": true
      }).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(1),
      })
    );
    await locklift.tracing.trace(
      nft.methods.burnNft({}).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(1.1),
      }), {
        allowedCodes: {
          contracts: {
            [nft.address.toString()]: {
              compute: [1018],
            },
          },
        },
      }
    );
    // must be not burned
    expect((await nft.getFullState()).state?.isDeployed).to.be.equal(true);

    // unblock
    await locklift.tracing.trace(
      collection.methods.setNftBurningBlocked({
        "nftId": "0",
        "isBlocked": false
      }).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(1),
      })
    );
    await locklift.tracing.trace(
      nft.methods.burnNft({}).send({
        from: ownerEverWallet.address,
        amount: locklift.utils.toNano(1.1),
      })
    );
    // must be deleted
    expect((await nft.getFullState()).state).to.be.equal(undefined);
  });

});
