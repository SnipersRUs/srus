#!/usr/bin/env python3
import requests

url = 'https://www.okx.com/api/v5/market/tickers'
params = {'instType': 'SWAP', 'settle': 'USDT'}
resp = requests.get(url, params=params, timeout=20)
data = resp.json()

tickers = data.get('data', [])

# Filter by volume and sort
sorted_tickers = sorted(tickers, key=lambda t: float(t.get('volCcy24h', 0)), reverse=True)

print('Top 10 by volume (24h):')
for i, t in enumerate(sorted_tickers[:10]):
    vol = float(t.get('volCcy24h', 0))
    inst_id = t.get('instId', '')
    print(f'{i+1}. {inst_id}: ${vol:,.0f}')

print(f'\nVolume threshold for filtering: $1,000,000')
high_vol_count = sum(1 for t in tickers if float(t.get('volCcy24h', 0)) >= 1000000)
print(f'Pairs above threshold: {high_vol_count}')
