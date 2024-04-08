import { Address, Contract, ProviderRpcClient } from "locklift";
import { FactorySource } from "../build/factorySource";
import {BN} from "bn.js";
import exp from "constants";

export async function checkIsOwner(collection: Contract<FactorySource['SegmintCollection']>, owner: Address) {
  const {state: cachedState} = await collection.getFullState();

  if (!cachedState) {
    throw new Error('Collection not deployed!');
  }

  const {fields} = await collection.getFields({cachedState: cachedState});
  if (!fields || !fields.owner_.equals(owner)) {
    throw new Error('You are not an owner!');
  }
}
export async function checkIsDeployed(address: Address, provider: ProviderRpcClient) {
  let {state} =await provider.getFullContractState({address})

  if (!state || !state.isDeployed) {
    throw new Error('Contract is not deployed');
  }
}

// tile - one 20x20 square in the collection
// On 1000x1000 pixels field we had 50x50 tiles
type Tile = {
  claimedInEpoch: number,
  tileX: number, // 0 - 50
  tileY: number //  0 - 50
}

type Field = {
  [key: string]: Tile;
};

export function parseTilesToField(parsed_mapping: [string, {epochWitNftId: string}][]) : Field {
  // parse mapping to object with key object[tileX*50 + tileY] = tile
  let field : Field = {};
  const maxNftIdBN = new BN('4294967295', 10);

  for (let elem of parsed_mapping) {
    let blockchainIndex = new BN(elem[0]);
    let nftIdEpochId = new BN(elem[1]);
    let epoch = nftIdEpochId.and(maxNftIdBN).toNumber();

    let x = blockchainIndex.shrn(6).toNumber();
    let y = blockchainIndex.and(new BN('63', 10)).toNumber();
    const index = x * 50 + y;
    field[index.toString()] = {
      claimedInEpoch: epoch,
      tileX: x,
      tileY: y
    }
  }

  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const index = x * 50 + y;
      if (!field[index]) {
        // not claimed at all
        field[index] = {
          claimedInEpoch: 0,
          tileX: x,
          tileY: y
        }
      }
    }
  }
  return field;
}

export function bufferToBytesArray(data: Buffer, width: number, height: number): string[] {
  // this is tricky
  // do not try to understand this to avoid mental illness
  let skipAlpha = width * height * 3 < data.length
  let pixels = data.reduce((list: number[], elem, i) => {
    if ((i + 1) % 4 !== 0 || !skipAlpha) {
      list.push(elem);
    }
    return list;
  }, []);

  let tiles : any = {};
  // x 0 - width, y - 0
  // x - > width,  y -> 0 - > width.
  for (let i = 0; i < pixels.length/3; i++) {
    let tX = Math.floor(Math.floor(i % width) /20);
    let tY = Math.floor(Math.floor(i / width)/20);
    let index = tX * 50 + tY;
    if (!tiles.hasOwnProperty(index.toString())) {
      tiles[index.toString()] = [];
    }
    tiles[index].push(pixels[i * 3]);
    tiles[index].push(pixels[i * 3 + 1]);
    tiles[index].push(pixels[i * 3 + 2]);
  }
  let bytesArray = [];
  for (let tX = 0; tX < width / 20; tX++) {
    for (let tY = 0; tY < height / 20; tY++) {
      let index = tX * 50 + tY;
      bytesArray.push(Buffer.from(tiles[index]).toString('base64'))
    }
  }

  return bytesArray;
}
