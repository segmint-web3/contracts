import { expect } from "chai";
import {Contract, Signer, WalletTypes} from "locklift";
import { FactorySource } from "../build/factorySource";
import {EverWalletAccount, HighloadWalletV2, SimpleKeystore} from "everscale-standalone-client";
import exp from "constants";
import { deployCollectionForOwner, getRandomTileColors } from "./utils";

let signer: Signer;
let ownerEverWallet: EverWalletAccount;

describe("Test collection", async function () {
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

    it("Deploy collection", async function () {
      const collection = await deployCollectionForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), false);
      const {state} = await collection.getFullState();
      expect(state?.isDeployed).to.be.true;
    });

    it("Mint with disabled state must fail", async function () {
      const collection = await deployCollectionForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), false);
      // expect(Number(response._state)).to.be.equal(NEW_STATE, "Wrong state");
      const tracing = await locklift.tracing.trace(
        collection.methods.claimTiles({
          "pixelStartX": 0,
          "pixelStartY": 0,
          "pixelEndX": 10,
          "pixelEndY": 10,
          "tilesToColorify": [getRandomTileColors()],
          "description": "no",
          "url": "no"
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(10),
        }),
        {
          allowedCodes: {
            contracts: {
              [collection.address.toString()]: {
                compute: [1010],
              },
            },
          },
        }
      )
      expect(await tracing.traceTree?.getAllErrors()[0].code === 1010).to.be.true;
    });

    it("Mint must be successfull", async function () {
      const collection = await deployCollectionForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true);

      let successfull_mint_tracing = await locklift.tracing.trace(
          collection.methods.claimTiles({
            "pixelStartX": 0,
            "pixelStartY": 0,
            "pixelEndX": 10,
            "pixelEndY": 10,
            "tilesToColorify": [getRandomTileColors()],
            "description": `Test mint 0x0`,
            "url": "https://google.com/"
          }).send({
            from: ownerEverWallet.address,
            amount: locklift.utils.toNano( 5),
          })
        )


      let claimed_tile = await collection.methods.getTile({
        answerId: 0,
        tilePixelX: 0,
        tilePixelY: 0
      }).call({responsible: true});
      expect(claimed_tile.nftId).to.be.equal('0');


      claimed_tile = await collection.methods.getTile({
        answerId: 0,
        tilePixelX: 0,
        tilePixelY: 10
      }).call({responsible: true});
      expect(claimed_tile.nftId).to.be.equal('4294967295');
    });

    it("One tile must not be claimed twice", async function () {
      const collection = await deployCollectionForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true);

      // expect(Number(response._state)).to.be.equal(NEW_STATE, "Wrong state");

      let successfull_mint_tracing = await locklift.tracing.trace(
        collection.methods.claimTiles({
          "pixelStartX": 0,
          "pixelStartY": 0,
          "pixelEndX": 10,
          "pixelEndY": 10,
          "tilesToColorify": [getRandomTileColors()],
          "description": `Test mint 0x0`,
          "url": "https://google.com/"
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano( 5),
        })
      )

      let fail_mint_tracing = await locklift.tracing.trace(
        collection.methods.claimTiles({
          "pixelStartX": 0,
          "pixelStartY": 0,
          "pixelEndX": 20,
          "pixelEndY": 20,
          "tilesToColorify": [getRandomTileColors(),getRandomTileColors(),getRandomTileColors(),getRandomTileColors()],
          "description": `Test mint 0x0`,
          "url": "https://google.com/"
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(20),
        }),
        {
          allowedCodes: {
            contracts: {
              [collection.address.toString()]: {
                compute: [1011],
              },
            },
          },
        }
      )

      let claimed_tile = await collection.methods.getTile({
        answerId: 0,
        tilePixelX: 0,
        tilePixelY: 0
      }).call({responsible: true});
      expect(claimed_tile.nftId).to.be.equal('0');


      claimed_tile = await collection.methods.getTile({
        answerId: 0,
        tilePixelX: 0,
        tilePixelY: 10
      }).call({responsible: true});
      expect(claimed_tile.nftId).to.be.equal('4294967295');
    });

    it("Full collection mint SKIPPED UNCOMMENT TO RUN", async function () {
      // for gas testing suppose. can take a hour.
      return;

      const collection = await deployCollectionForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true);

      let successfull_mint_tracing
      for (let y = 0; y < 100; y++) {
        console.log('mint line', y);

        let pixels = [];
        for (let i = 0; i < 100; i++)
          pixels.push(getRandomTileColors())

        successfull_mint_tracing = await locklift.tracing.trace(
          collection.methods.claimTiles({
            "pixelStartX": 0,
            "pixelStartY": y * 10,
            "pixelEndX": 1000,
            "pixelEndY": y * 10 + 10,
            "tilesToColorify": pixels,
            "description": `Test mint 0-1000,${y}-${y+10}`,
            "url": "https://google.com/"
          }).send({
            from: ownerEverWallet.address,
            amount: locklift.utils.toNano(100 * 0.3 + 5),
          })
        )
      }

      await successfull_mint_tracing?.traceTree?.beautyPrint();

      const {state} = await collection.getFullState();

      for (let x = 0; x < 1000; x += 10) {
        for (let y = 0; y < 1000; y += 10) {
          const claimed_tile = await collection.methods.getTile({
            answerId: 0,
            tilePixelX: x,
            tilePixelY: y
          }).call({responsible: true, cachedState: state});
          expect(claimed_tile.nftId).to.not.equal('4294967295');
        }
      }
    }).timeout(2000000000);
  });
});
