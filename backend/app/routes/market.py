from fastapi import APIRouter
from pydantic import BaseModel
import yfinance as yf
from cachetools import TTLCache, cached
import asyncio
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# YFinance Tickes Map
TICKER_MAP = {
    "Gold": "GC=F",
    "Silver": "SI=F",
    "Copper": "HG=F",
    "Crude Oil": "CL=F",
    "Brent Oil": "BZ=F",
    "Natural Gas": "NG=F",
    "USD": "DX-Y.NYB",
    "EUR": "EURUSD=X",
    "GBP": "GBPUSD=X",
    "INR": "USDINR=X",
    "JPY": "JPY=X",
    "CNY": "CNY=X",
    "Bitcoin": "BTC-USD",
    "Ethereum": "ETH-USD",
    "Solana": "SOL-USD",
    "BNB": "BNB-USD",
    "S&P 500": "^GSPC",
    "NASDAQ": "^IXIC",
    "Dow Jones": "^DJI",
    "NIFTY 50": "^NSEI",
    "SENSEX": "^BSESN",
    "FTSE 100": "^FTSE",
    "DAX": "^GDAXI"
}

# 5 min cache
cache = TTLCache(maxsize=100, ttl=300)

class MarketAsset(BaseModel):
    asset: str
    price: float
    daily_change: float
    daily_percent: float
    weekly_percent: float
    monthly_percent: float
    trend: str

class MarketResponse(BaseModel):
    data: list[MarketAsset]

@cached(cache)
def fetch_market_data():
    tickers_list = list(TICKER_MAP.values())
    try:
        # Download 1 month of historical data to compute daily, weekly, monthly changes
        hist = yf.download(tickers_list, period="1mo", group_by="ticker", auto_adjust=True, progress=False)
        
        results = []
        for name, ticker in TICKER_MAP.items():
            try:
                # pandas MultiIndex handling (when fetching multiple tickers)
                if ticker in hist:
                    closes = hist[ticker]['Close'].dropna()
                else:
                    closes = hist['Close'].dropna()

                if len(closes) == 0:
                    continue
                    
                current_price = closes.iloc[-1]
                
                # Daily % and Absolute (compare to prev day)
                if len(closes) >= 2:
                    daily_change = current_price - closes.iloc[-2]
                    daily = daily_change / closes.iloc[-2] * 100
                else:
                    daily_change = 0.0
                    daily = 0.0
                    
                # Weekly % (approx 5 trading days ago, or 7 calendar days if crypto)
                w_idx = min(len(closes)-1, 5) if name not in ["Bitcoin", "Ethereum", "Solana", "BNB"] else min(len(closes)-1, 7)
                weekly = (current_price - closes.iloc[-1 - w_idx]) / closes.iloc[-1 - w_idx] * 100 if w_idx > 0 else 0.0
                
                # Monthly % (first element of 1mo history)
                monthly = (current_price - closes.iloc[0]) / closes.iloc[0] * 100
                
                if daily > 0:
                    trend = "bullish"
                elif daily < 0:
                    trend = "bearish"
                else:
                    trend = "neutral"
                    
                results.append(MarketAsset(
                    asset=name,
                    price=float(current_price),
                    daily_change=float(daily_change),
                    daily_percent=float(daily),
                    weekly_percent=float(weekly),
                    monthly_percent=float(monthly),
                    trend=trend
                ))
            except Exception as e:
                logger.warning(f"Error processing {name}: {e}")
                
        return results
    except Exception as e:
        logger.error(f"Error fetching market data: {e}")
        return []

@router.get("", response_model=MarketResponse)
async def get_market_data():
    # Run synchronous yfinance fetch in a thread
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, fetch_market_data)
    return MarketResponse(data=data)
