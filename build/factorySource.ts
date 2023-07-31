const blockListAbi = {"ABIversion":2,"version":"2.3","header":["time"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"addManager","inputs":[{"name":"manager","type":"address"}],"outputs":[]},{"name":"removeManager","inputs":[{"name":"manager","type":"address"}],"outputs":[]},{"name":"addToBanList","inputs":[{"name":"nftId","type":"uint32"}],"outputs":[]},{"name":"removeFromBanList","inputs":[{"name":"nftId","type":"uint32"}],"outputs":[]},{"name":"cleanBanList","inputs":[],"outputs":[]}],"data":[{"key":1,"name":"owner_","type":"address"}],"events":[{"name":"NftBlocked","inputs":[{"name":"id","type":"uint32"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"owner_","type":"address"},{"name":"managers_","type":"map(address,bool)"},{"name":"blocked_","type":"map(uint32,bool)"}]} as const
const indexAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","inputs":[{"name":"collection","type":"address"}],"outputs":[]},{"name":"getInfo","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"collection","type":"address"},{"name":"owner","type":"address"},{"name":"nft","type":"address"}]},{"name":"destruct","inputs":[{"name":"gasReceiver","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"_nft","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_nft","type":"address"},{"name":"_collection","type":"address"},{"name":"_owner","type":"address"}]} as const
const indexBasisAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"getInfo","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"collection","type":"address"}]},{"name":"destruct","inputs":[{"name":"gasReceiver","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"_collection","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_collection","type":"address"}]} as const
const segmintCollectionAbi = {"ABIversion":2,"version":"2.3","header":["time"],"functions":[{"name":"constructor","inputs":[{"name":"codeNft","type":"cell"},{"name":"codeIndex","type":"cell"},{"name":"codeIndexBasis","type":"cell"},{"name":"jsonMetadata","type":"string"}],"outputs":[]},{"name":"changeOwner","inputs":[{"name":"newOwner","type":"address"}],"outputs":[]},{"name":"disableMint","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"enableMint","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"getMintDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"changeEpoch","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint32"},{"name":"value1","type":"uint128"}]},{"name":"setNftBurningBlocked","inputs":[{"name":"nftId","type":"uint32"},{"name":"isBlocked","type":"bool"}],"outputs":[]},{"name":"claimTiles","inputs":[{"name":"pixelStartX","type":"uint10"},{"name":"pixelStartY","type":"uint10"},{"name":"pixelEndX","type":"uint10"},{"name":"pixelEndY","type":"uint10"},{"components":[{"name":"r","type":"uint80[]"},{"name":"g","type":"uint80[]"},{"name":"b","type":"uint80[]"}],"name":"tilesToColorify","type":"tuple[]"},{"name":"description","type":"string"},{"name":"url","type":"string"},{"name":"coinsToRedrawOneTile","type":"uint128"}],"outputs":[]},{"name":"colorifyTile","inputs":[{"name":"nftId","type":"uint32"},{"components":[{"name":"r","type":"uint80[]"},{"name":"g","type":"uint80[]"},{"name":"b","type":"uint80[]"}],"name":"tileColors","type":"tuple"},{"name":"tilePixelX","type":"uint10"},{"name":"tilePixelY","type":"uint10"},{"name":"sendGasBack","type":"address"}],"outputs":[]},{"name":"burnNft","inputs":[{"name":"nftId","type":"uint32"},{"name":"lockedAmount","type":"uint128"},{"name":"nftPixelStartX","type":"uint10"},{"name":"nftPixelStartY","type":"uint10"},{"name":"nftPixelEndX","type":"uint10"},{"name":"nftPixelEndY","type":"uint10"}],"outputs":[]},{"name":"getTile","inputs":[{"name":"answerId","type":"uint32"},{"name":"tilePixelX","type":"uint10"},{"name":"tilePixelY","type":"uint10"}],"outputs":[{"name":"pixels","type":"uint8[]"},{"name":"nftId","type":"uint32"},{"name":"epoch","type":"uint32"}]},{"name":"convertTileColorsToPixels","inputs":[{"name":"answerId","type":"uint32"},{"components":[{"name":"r","type":"uint80[]"},{"name":"g","type":"uint80[]"},{"name":"b","type":"uint80[]"}],"name":"tileColors","type":"tuple"}],"outputs":[{"name":"pixels","type":"uint8[]"}]},{"name":"getTilesColors","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"components":[{"name":"r","type":"uint80[]"},{"name":"g","type":"uint80[]"},{"name":"b","type":"uint80[]"}],"name":"value0","type":"map(uint14,tuple)"}]},{"name":"getTilesOwners","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"map(uint14,uint64)"}]},{"name":"getData","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"nftCounter","type":"uint32"},{"name":"epoch","type":"uint32"},{"name":"currentEpochPixelTilePrice","type":"uint128"},{"name":"mintDisabled","type":"bool"}]},{"name":"getNftIndexCodeHash","inputs":[{"name":"answerId","type":"uint32"},{"name":"_owner","type":"address"}],"outputs":[{"name":"codeHash","type":"string"}]},{"name":"indexBasisCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"code","type":"cell"}]},{"name":"indexBasisCodeHash","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"hash","type":"uint256"}]},{"name":"resolveIndexBasis","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"indexBasis","type":"address"}]},{"name":"indexCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"code","type":"cell"}]},{"name":"indexCodeHash","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"hash","type":"uint256"}]},{"name":"getJson","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"json","type":"string"}]},{"name":"totalSupply","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"count","type":"uint128"}]},{"name":"nftCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"code","type":"cell"}]},{"name":"nftCodeHash","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"codeHash","type":"uint256"}]},{"name":"nftAddress","inputs":[{"name":"answerId","type":"uint32"},{"name":"id","type":"uint256"}],"outputs":[{"name":"nft","type":"address"}]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]}],"data":[{"key":1,"name":"owner_","type":"address"},{"key":2,"name":"nonce_","type":"uint16"}],"events":[{"name":"MintDisabledChanged","inputs":[{"name":"newValue","type":"bool"}],"outputs":[]},{"name":"TileColorify","inputs":[{"name":"nftId","type":"uint32"},{"name":"nftEpoch","type":"uint32"},{"name":"pixelStartX","type":"uint10"},{"name":"pixelStartY","type":"uint10"},{"components":[{"name":"r","type":"uint80[]"},{"name":"g","type":"uint80[]"},{"name":"b","type":"uint80[]"}],"name":"tileColors","type":"tuple"}],"outputs":[]},{"name":"NftMinted","inputs":[{"name":"nftId","type":"uint32"},{"name":"nftEpoch","type":"uint32"},{"name":"owner","type":"address"},{"name":"pixelStartX","type":"uint10"},{"name":"pixelStartY","type":"uint10"},{"name":"pixelEndX","type":"uint10"},{"name":"pixelEndY","type":"uint10"}],"outputs":[]},{"name":"EpochChanged","inputs":[{"name":"newEpoch","type":"uint32"},{"name":"oneTileClaimPrice","type":"uint128"}],"outputs":[]},{"name":"NftCreated","inputs":[{"name":"id","type":"uint256"},{"name":"nft","type":"address"},{"name":"owner","type":"address"},{"name":"manager","type":"address"},{"name":"creator","type":"address"}],"outputs":[]},{"name":"NftBurned","inputs":[{"name":"id","type":"uint256"},{"name":"nft","type":"address"},{"name":"owner","type":"address"},{"name":"manager","type":"address"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_supportedInterfaces","type":"optional(cell)"},{"name":"_codeNft","type":"cell"},{"name":"_totalSupply","type":"uint128"},{"name":"_json","type":"string"},{"name":"_codeIndex","type":"cell"},{"name":"_codeIndexBasis","type":"cell"},{"name":"_indexDeployValue","type":"uint128"},{"name":"_indexDestroyValue","type":"uint128"},{"name":"_deployIndexBasisValue","type":"uint128"},{"name":"owner_","type":"address"},{"name":"nonce_","type":"uint16"},{"name":"mintDisabled_","type":"bool"},{"components":[{"name":"r","type":"uint80[]"},{"name":"g","type":"uint80[]"},{"name":"b","type":"uint80[]"}],"name":"tiles_","type":"map(uint14,tuple)"},{"name":"tileOwner_","type":"map(uint14,uint64)"},{"name":"nftCounter_","type":"uint32"},{"name":"currentEpoch_","type":"uint32"},{"name":"currentEpochTilesLeft_","type":"uint14"},{"name":"currentEpochPixelTilePrice_","type":"uint128"},{"name":"epochTilePriceGrow_","type":"uint128"}]} as const
const segmintNftAbi = {"ABIversion":2,"version":"2.3","header":["time"],"functions":[{"name":"constructor","inputs":[{"name":"owner","type":"address"},{"name":"sendGasTo","type":"address"},{"name":"remainOnNft","type":"uint128"},{"name":"indexDeployValue","type":"uint128"},{"name":"indexDestroyValue","type":"uint128"},{"name":"codeIndex","type":"cell"},{"name":"lockedAmount","type":"uint128"},{"name":"nftPixelsStartX","type":"uint10"},{"name":"nftPixelsStartY","type":"uint10"},{"name":"nftPixelsEndX","type":"uint10"},{"name":"nftPixelsEndY","type":"uint10"},{"name":"description","type":"string"},{"name":"url","type":"string"}],"outputs":[]},{"name":"getJson","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"json","type":"string"}]},{"name":"getNftCustomData","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"id","type":"uint256"},{"name":"owner","type":"address"},{"name":"collection","type":"address"},{"name":"lockedAmount","type":"uint128"},{"name":"description","type":"string"},{"name":"url","type":"string"},{"name":"tilePixelsStartX","type":"uint10"},{"name":"tilePixelsStartY","type":"uint10"},{"name":"tilePixelsEndX","type":"uint10"},{"name":"tilePixelsEndY","type":"uint10"}]},{"name":"colorify","inputs":[{"components":[{"name":"r","type":"uint80[]"},{"name":"g","type":"uint80[]"},{"name":"b","type":"uint80[]"}],"name":"tilesToColorify","type":"tuple[]"},{"name":"description","type":"string"},{"name":"url","type":"string"},{"name":"coinsToRedrawOneTile","type":"uint128"},{"name":"sendGasBack","type":"address"}],"outputs":[]},{"name":"setBurningBlocked","inputs":[{"name":"isBlocked","type":"bool"},{"name":"sendGasBack","type":"address"}],"outputs":[]},{"name":"burnNft","inputs":[],"outputs":[]},{"name":"onBurnSuccess","inputs":[],"outputs":[]},{"name":"onBurnError","inputs":[],"outputs":[]},{"name":"indexCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"code","type":"cell"}]},{"name":"indexCodeHash","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"hash","type":"uint256"}]},{"name":"resolveIndex","inputs":[{"name":"answerId","type":"uint32"},{"name":"collection","type":"address"},{"name":"owner","type":"address"}],"outputs":[{"name":"index","type":"address"}]},{"name":"transfer","inputs":[{"name":"to","type":"address"},{"name":"sendGasTo","type":"address"},{"components":[{"name":"value","type":"uint128"},{"name":"payload","type":"cell"}],"name":"callbacks","type":"map(address,tuple)"}],"outputs":[]},{"name":"changeOwner","inputs":[{"name":"newOwner","type":"address"},{"name":"sendGasTo","type":"address"},{"components":[{"name":"value","type":"uint128"},{"name":"payload","type":"cell"}],"name":"callbacks","type":"map(address,tuple)"}],"outputs":[]},{"name":"changeManager","inputs":[{"name":"newManager","type":"address"},{"name":"sendGasTo","type":"address"},{"components":[{"name":"value","type":"uint128"},{"name":"payload","type":"cell"}],"name":"callbacks","type":"map(address,tuple)"}],"outputs":[]},{"name":"getInfo","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"id","type":"uint256"},{"name":"owner","type":"address"},{"name":"manager","type":"address"},{"name":"collection","type":"address"}]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]}],"data":[{"key":1,"name":"_id","type":"uint256"}],"events":[{"name":"NftCreated","inputs":[{"name":"id","type":"uint256"},{"name":"owner","type":"address"},{"name":"manager","type":"address"},{"name":"collection","type":"address"}],"outputs":[]},{"name":"OwnerChanged","inputs":[{"name":"oldOwner","type":"address"},{"name":"newOwner","type":"address"}],"outputs":[]},{"name":"ManagerChanged","inputs":[{"name":"oldManager","type":"address"},{"name":"newManager","type":"address"}],"outputs":[]},{"name":"NftBurned","inputs":[{"name":"id","type":"uint256"},{"name":"owner","type":"address"},{"name":"manager","type":"address"},{"name":"collection","type":"address"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_supportedInterfaces","type":"optional(cell)"},{"name":"_id","type":"uint256"},{"name":"_collection","type":"address"},{"name":"_owner","type":"address"},{"name":"_manager","type":"address"},{"name":"_indexDeployValue","type":"uint128"},{"name":"_indexDestroyValue","type":"uint128"},{"name":"_codeIndex","type":"cell"},{"name":"nftPixelsStartX_","type":"uint10"},{"name":"nftPixelsStartY_","type":"uint10"},{"name":"nftPixelsEndX_","type":"uint10"},{"name":"nftPixelsEndY_","type":"uint10"},{"name":"remainOnNft_","type":"uint128"},{"name":"lockedAmount_","type":"uint128"},{"name":"description_","type":"string"},{"name":"url_","type":"string"},{"name":"burnInProgress_","type":"bool"},{"name":"isBurningBlocked_","type":"bool"}]} as const

export const factorySource = {
    BlockList: blockListAbi,
    Index: indexAbi,
    IndexBasis: indexBasisAbi,
    SegmintCollection: segmintCollectionAbi,
    SegmintNft: segmintNftAbi
} as const

export type FactorySource = typeof factorySource
export type BlockListAbi = typeof blockListAbi
export type IndexAbi = typeof indexAbi
export type IndexBasisAbi = typeof indexBasisAbi
export type SegmintCollectionAbi = typeof segmintCollectionAbi
export type SegmintNftAbi = typeof segmintNftAbi
