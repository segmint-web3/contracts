import chai, { expect } from "chai";
import { lockliftChai } from "locklift";
chai.use(lockliftChai);

import { Signer } from "locklift";
import { EverWalletAccount, SimpleKeystore } from "everscale-standalone-client";
import { deployCollectionAndTokenForOwner, encodeMintPayload, getRandomTileColors, metadata } from "./utils";
import BigNumber from "bignumber.js";

let signer: Signer;
let ownerEverWallet: EverWalletAccount;

// must be x/10 for venom
const colorifyOneTilePrice = 0.3;

// can be x/10 for venom
// wallet -> token 0.9, waltet -> wallet 0.5, wallet -> collection 0.5, collection -> nft(colorify) 0.5;
const maximumFwdFeeForBigMint = 0.9 + 0.5 + 0.5 + 0.5 + 0.5;

// 1 for deploy nft + indexes, 0.2 for fwd fee + 1 coin reserved on collection contract
const oneNftMintingCost = 2.2;

// whole block, 1 for se, 0.2 for venom.
const maximumClaimGasPrice = 1;

describe("Test collection", async function () {
  before(async () => {
    let randKeypair = SimpleKeystore.generateKeyPair();
    await locklift.keystore.addKeyPair("random", randKeypair);
    signer = (await locklift.keystore.getSigner("random"))!;
    ownerEverWallet = await EverWalletAccount.fromPubkey({publicKey: randKeypair.publicKey});
    await locklift.giver.sendTo(ownerEverWallet.address, locklift.utils.toNano(100))
    await locklift.factory.accounts.storage.addAccount(ownerEverWallet);
  });

  describe("Contracts", async function () {
    it("Load contract factory", async function () {
      for (let contract of ['Index', 'IndexBasis', 'SegmintCollection', 'SegmintNft', 'TokenWalletUpgradeable', 'TokenRootUpgradeable', 'TokenWalletPlatform']) {
        const artifacts = await locklift.factory.getContractArtifacts("SegmintCollection");
        expect(artifacts.code).not.to.equal(undefined, "Code should be available");
        expect(artifacts.abi).not.to.equal(undefined, "ABI should be available");
        expect(artifacts.tvc).not.to.equal(undefined, "tvc should be available");
      }
    });

    it("Deploy collection", async function () {
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), false, 0);
      const {state} = await collection.getFullState();
      expect(state?.isDeployed).to.be.true;
    });

    it("Mint with disabled state must fail, tokens must return back", async function () {
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), false, 100);

      await locklift.tracing.trace(
        tokenWallet.methods.transfer({
          amount: 100_000_000_000,
          recipient: collection.address,
          deployWalletValue: '0',
          remainingGasTo: ownerEverWallet.address,
          notify: true,
          payload: await encodeMintPayload({
            "pixelStartX": 0,
            "pixelStartY": 0,
            "pixelEndX": 10,
            "pixelEndY": 10,
            "tilesToColorify": [getRandomTileColors()],
            "description": "no",
            "url": "no",
            "coinsToRedrawOneTile" : locklift.utils.toNano(colorifyOneTilePrice)
          })
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(10),
        })
      )
      const {value0: nftCounter} = await collection.methods.getNftCount({answerId: 0}).call({responsible: true});
      expect(nftCounter).to.be.equal('0');
      const {value0: balance} = await tokenWallet.methods.balance({answerId: 0}).call({responsible: true});
      expect(balance).to.be.equal(new BigNumber(100).shiftedBy(9).toFixed());
    });

    it("Mint must be successfull", async function () {
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true, 100);

      await locklift.tracing.trace(
        tokenWallet.methods.transfer({
          amount: 100_000_000_000,
          recipient: collection.address,
          deployWalletValue: '0',
          remainingGasTo: ownerEverWallet.address,
          notify: true,
          payload: await encodeMintPayload({
            "pixelStartX": 0,
            "pixelStartY": 0,
            "pixelEndX": 10,
            "pixelEndY": 10,
            "tilesToColorify": [getRandomTileColors()],
            "description": "no",
            "url": "no",
            "coinsToRedrawOneTile" : locklift.utils.toNano(colorifyOneTilePrice)
          })
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(10),
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

    it("One tile must not be claimed twice, tokens must return", async function () {
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true, 500);

      await locklift.tracing.trace(
        tokenWallet.methods.transfer({
          amount: 100_000_000_000,
          recipient: collection.address,
          deployWalletValue: '0',
          remainingGasTo: ownerEverWallet.address,
          notify: true,
          payload: await encodeMintPayload({
            "pixelStartX": 0,
            "pixelStartY": 0,
            "pixelEndX": 10,
            "pixelEndY": 10,
            "tilesToColorify": [getRandomTileColors()],
            "description": "no",
            "url": "no",
            "coinsToRedrawOneTile" : locklift.utils.toNano(colorifyOneTilePrice)
          })
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(10),
        })
      )


      await locklift.tracing.trace(
        tokenWallet.methods.transfer({
          amount: 400_000_000_000,
          recipient: collection.address,
          deployWalletValue: '0',
          remainingGasTo: ownerEverWallet.address,
          notify: true,
          payload: await encodeMintPayload({
            "pixelStartX": 0,
            "pixelStartY": 0,
            "pixelEndX": 20,
            "pixelEndY": 20,
            "tilesToColorify": [getRandomTileColors(), getRandomTileColors(), getRandomTileColors(), getRandomTileColors()],
            "description": "no",
            "url": "no",
            "coinsToRedrawOneTile" : locklift.utils.toNano(colorifyOneTilePrice)
          })
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(10),
        })
      )

      const claimed_tile = await collection.methods.getTile({
        answerId: 0,
        tilePixelX: 0,
        tilePixelY: 0
      }).call({responsible: true});
      expect(claimed_tile.nftId).to.be.equal('0');

      const unclaimed_tile = await collection.methods.getTile({
        answerId: 0,
        tilePixelX: 0,
        tilePixelY: 10
      }).call({responsible: true});
      expect(unclaimed_tile.nftId).to.be.equal('4294967295');

      const {value0: balance} = await tokenWallet.methods.balance({answerId: 0}).call({responsible: true});
      expect(balance).to.be.equal(new BigNumber(400).shiftedBy(9).toFixed());
    });


    it("Full collection mint SKIPPED UNCOMMENT TO RUN", async function () {
      // for gas testing suppose. can take an hour.
      // return;
      await locklift.giver.sendTo(ownerEverWallet.address, locklift.utils.toNano(3000))
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true, 1_000_000);

      let successfull_mint_tracing;
      for (let y = 0; y < 100; y++) {
        console.log('mint line', y);

        let tiles = [];
        for (let i = 0; i < 100; i++)
          tiles.push(getRandomTileColors())

        successfull_mint_tracing = await locklift.tracing.trace(
          tokenWallet.methods.transfer({
            amount: 10_000_000_000_000, // 10k$
            recipient: collection.address,
            deployWalletValue: '0',
            remainingGasTo: ownerEverWallet.address,
            notify: true,
            payload: await encodeMintPayload({
              "pixelStartX": 0,
              "pixelStartY": y * 10,
              "pixelEndX": 1000,
              "pixelEndY": y * 10 + 10,
              "tilesToColorify": tiles,
              "description": `Test mint 0-1000,${y}-${y+10}`,
              "url": "https://google.com/",
              "coinsToRedrawOneTile" : locklift.utils.toNano(colorifyOneTilePrice)
            })
          }).send({
            from: ownerEverWallet.address,
            amount: locklift.utils.toNano(100 * colorifyOneTilePrice + oneNftMintingCost + maximumClaimGasPrice + maximumFwdFeeForBigMint),
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

    it("onlyOwner functions must throw error if called from non owner address", async function () {
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true, 1_000_000);
      let nonOwnerKeypair = SimpleKeystore.generateKeyPair();
      await locklift.keystore.addKeyPair(nonOwnerKeypair);
      const nonOwnerEverWallet = await EverWalletAccount.fromPubkey({publicKey: nonOwnerKeypair.publicKey});
      await locklift.factory.accounts.storage.addAccount(nonOwnerEverWallet);
      await locklift.giver.sendTo(nonOwnerEverWallet.address, locklift.utils.toNano(10))

      let methods = [
        {name: 'changeOwner', params: {newOwner: ownerEverWallet.address.toString()}},
        {name: 'disableMint', params: {answerId: '0'}},
        {name: 'enableMint',  params: {answerId: '0'}},
        {name: 'withdraw',    params: {fromWallet: tokenWallet.address, to: nonOwnerEverWallet.address, deploy_wallet_value: locklift.utils.toNano(0.15),  amount: '1'}},
        {name: 'changeOneTilePrice',  params: {newTilePrice: '1'}},
      ];

      for (let method of methods) {
        let tracing = await locklift.tracing.trace(
          // @ts-ignore
          collection.methods[method.name](method.params).send({
            from: nonOwnerEverWallet.address,
            amount: locklift.utils.toNano(1),
          }),
          {
            allowedCodes: {
              contracts: {
                [collection.address.toString()]: {
                  compute: [1000],
                },
              },
            },
          }
        )
        expect(tracing.traceTree).to.have.error(1000);
      }
    });

    it("Change owner must work correctly", async function () {
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true, 1_000_000);

      const newOwnerKeypair = SimpleKeystore.generateKeyPair();
      await locklift.keystore.addKeyPair(newOwnerKeypair);
      const newOwnerEverWallet = await EverWalletAccount.fromPubkey({publicKey: newOwnerKeypair.publicKey});
      await locklift.factory.accounts.storage.addAccount(newOwnerEverWallet);
      await locklift.giver.sendTo(newOwnerEverWallet.address, locklift.utils.toNano(10))

      await locklift.tracing.trace(
        collection.methods.changeOwner({
          newOwner: newOwnerEverWallet.address
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(1),
        })
      )

      await locklift.tracing.trace(
        collection.methods.acceptOwnership({}).send({
          from: newOwnerEverWallet.address,
          amount: locklift.utils.toNano(1),
        })
      )

      await locklift.tracing.trace(
        collection.methods.enableMint({answerId: 0}).send({
          from: newOwnerEverWallet.address,
          amount: locklift.utils.toNano(1),
        })
      )
    });

    it("Nft code test", async function () {
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), false, 0);
      const nftArtifacts = await locklift.factory.getContractArtifacts("SegmintNft");
      const response = await collection.methods.nftCodeWithoutSalt({answerId: 0}).call();
      expect(response.nftCode).to.be.equal(nftArtifacts.code);
    });

    it("TIP6 test", async function () {
      //TODO verify
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), false, 0);

      // ITIP6
      let response = await collection.methods.supportsInterface({answerId: 0, interfaceID: "0x3204EC29"}).call();
      expect(response.value0).to.be.equal(true);

      //TIP4-1
      response = await collection.methods.supportsInterface({answerId: 0, interfaceID: "0x1217AAAB"}).call();
      expect(response.value0).to.be.equal(true);

      //TIP4-2
      response = await collection.methods.supportsInterface({answerId: 0, interfaceID: "0x24D7D5F5"}).call();
      expect(response.value0).to.be.equal(true);

      //TIP-4-3
      response = await collection.methods.supportsInterface({answerId: 0, interfaceID: "0x4387BBFB"}).call();
      expect(response.value0).to.be.equal(true);
    });

    it("Collection JSON metadata test", async function () {
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), false, 0);

      let response = await collection.methods.getJson({answerId: 0}).call({responsible: true});
      expect(response.json).to.be.equal(JSON.stringify(metadata()));
    });

    it("Owner must be able to withdraw tokens", async function () {
      const {collection, tokenRoot, tokenWallet} = await deployCollectionAndTokenForOwner(ownerEverWallet, locklift.utils.getRandomNonce(), true, 100);

      await locklift.tracing.trace(
        tokenWallet.methods.transfer({
          amount: 100_000_000_000,
          recipient: collection.address,
          deployWalletValue: '0',
          remainingGasTo: ownerEverWallet.address,
          notify: true,
          payload: await encodeMintPayload({
            "pixelStartX": 0,
            "pixelStartY": 0,
            "pixelEndX": 10,
            "pixelEndY": 10,
            "tilesToColorify": [getRandomTileColors()],
            "description": "no",
            "url": "no",
            "coinsToRedrawOneTile" : locklift.utils.toNano(colorifyOneTilePrice)
          })
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(10),
        })
      )

      const {value0: balance} = await tokenWallet.methods.balance({answerId: 0}).call({responsible: true});
      expect(balance).to.be.equal('0');

      const {value0: collectionTokenWalletAddress} = await tokenRoot.methods.walletOf({answerId: 0, walletOwner: collection.address}).call({responsible: true});

      await locklift.tracing.trace(
        collection.methods.withdraw({
          fromWallet: collectionTokenWalletAddress,
          to: ownerEverWallet.address,
          deploy_wallet_value: locklift.utils.toNano(0.15),
          amount: 100_000_000_000
        }).send({
          from: ownerEverWallet.address,
          amount: locklift.utils.toNano(10),
        })
      )

      const {value0: balanceAfterWithdraw} = await tokenWallet.methods.balance({answerId: 0}).call({responsible: true});
      expect(balanceAfterWithdraw).to.be.equal(new BigNumber(100).shiftedBy(9).toFixed());
    });
  });
});
