import type {
  AssetSymbol,
  CreateOrderRequest,
  LeveragePairSymbol,
  LeverageSymbol,
  MarketSymbol,
  SpotSymbol,
  TradingVolumeSymbol
} from "../../src/index.ts";

const spotSymbol: SpotSymbol = "BTC";
const leverageSymbol: LeverageSymbol = "BTC_JPY";
const marketSymbol: MarketSymbol = leverageSymbol;
const leveragePairSymbol: LeveragePairSymbol = "BTC/JPY";
const tradingVolumeSymbol: TradingVolumeSymbol = leveragePairSymbol;
const assetSymbol: AssetSymbol = "ZPG";

const limitOrder: CreateOrderRequest = {
  symbol: spotSymbol,
  side: "BUY",
  executionType: "LIMIT",
  timeInForce: "FAS",
  price: "1",
  size: "1"
};

const marketOrder: CreateOrderRequest = {
  symbol: marketSymbol,
  side: "SELL",
  executionType: "MARKET",
  size: "1"
};

const stopOrder: CreateOrderRequest = {
  symbol: leverageSymbol,
  side: "BUY",
  executionType: "STOP",
  price: "1",
  size: "1"
};

void limitOrder;
void marketOrder;
void stopOrder;
void tradingVolumeSymbol;
void assetSymbol;

// @ts-expect-error Leverage symbols are not spot symbols.
const invalidSpotSymbol: SpotSymbol = "BTC_JPY";

// @ts-expect-error Slash-form leverage pair symbols are only used by tradingVolume.
const invalidMarketSymbol: MarketSymbol = "BTC/JPY";

// @ts-expect-error Underscore-form leverage symbols are not returned by tradingVolume.
const invalidTradingVolumeSymbol: TradingVolumeSymbol = "BTC_JPY";

const invalidStopOrder: CreateOrderRequest = {
  symbol: leverageSymbol,
  side: "BUY",
  executionType: "STOP",
  // @ts-expect-error timeInForce can only be specified for LIMIT orders.
  timeInForce: "FAS",
  price: "1",
  size: "1"
};

const invalidMarketOrder: CreateOrderRequest = {
  symbol: spotSymbol,
  side: "BUY",
  executionType: "MARKET",
  // @ts-expect-error timeInForce can only be specified for LIMIT orders.
  timeInForce: "FAK",
  size: "1"
};

// @ts-expect-error STOP orders require a price.
const invalidStopOrderWithoutPrice: CreateOrderRequest = {
  symbol: leverageSymbol,
  side: "BUY",
  executionType: "STOP",
  size: "1"
};

const marketOrderWithCancelBefore: CreateOrderRequest = {
  symbol: spotSymbol,
  side: "SELL",
  executionType: "MARKET",
  cancelBefore: true,
  size: "1"
};

// @ts-expect-error cancelBefore is only supported for MARKET orders.
const invalidLimitOrderWithCancelBefore: CreateOrderRequest = {
  symbol: marketSymbol,
  side: "BUY",
  executionType: "LIMIT",
  price: "1",
  size: "1",
  cancelBefore: true
};

void invalidSpotSymbol;
void invalidMarketSymbol;
void invalidTradingVolumeSymbol;
void invalidStopOrder;
void invalidMarketOrder;
void invalidStopOrderWithoutPrice;
void marketOrderWithCancelBefore;
void invalidLimitOrderWithCancelBefore;
