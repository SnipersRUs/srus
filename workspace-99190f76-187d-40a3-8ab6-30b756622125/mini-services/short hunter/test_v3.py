#!/usr/bin/env python3
from short_hunter_bot_v3_dynamic import MarketDataFetcher

print('Testing V3 Dynamic Scanner...')
fetcher = MarketDataFetcher()
print(f'\nLoaded {len(fetcher.available_assets)} assets')
if len(fetcher.available_assets) > 0:
    print('Top 5 assets by volume:')
    for i, asset in enumerate(fetcher.available_assets[:5]):
        vol = asset['volume24h']
        symbol = asset['s']
        print(f'  {i+1}. {symbol}: ${vol:,.0f} daily volume')
