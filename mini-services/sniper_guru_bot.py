import json
import time
import os
import datetime
import requests

# Configuration
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'data')
SNIPER_FILE = os.path.join(DATA_DIR, 'sniper_guru_trades.json')
SHORT_HUNTER_FILE = os.path.join(DATA_DIR, 'active_trades.json')
BOUNTY_SEEKER_FILE = os.path.join(DATA_DIR, 'bounty_seeker_status.json')

MIN_SCORE = 80
MAX_POSITIONS = 3
LEVERAGE = 10
STOP_LOSS_PCT = 0.01 # 1% price move = 10% equity with 10x leverage
POSITION_SIZE_PCT = 10 # 10% of equity per trade = 1% risk with 10x lev and 1% SL
MAX_TRADE_HISTORY = 100 # Keep last 100 trades

def load_json(filepath):
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    return None

def save_json(filepath, data):
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error writing {filepath}: {e}")

def get_current_prices(symbols):
    """Fetch current prices for a list of symbols from Binance"""
    if not symbols:
        return {}
    
    prices = {}
    try:
        url = "https://api.binance.com/api/v3/ticker/price"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            market_map = {item['symbol']: float(item['price']) for item in data}
            
            for symbol in symbols:
                clean_sym = symbol.replace('/', '').replace(':', '').replace('USDT', '') + 'USDT'
                if clean_sym in market_map:
                    prices[symbol] = market_map[clean_sym]
    except Exception as e:
        print(f"Error fetching prices: {e}")
        
    return prices

def calculate_position_size(equity, entry_price, stop_loss):
    """Calculate position size based on risk management"""
    # Risk 1% of equity per trade
    risk_amount = equity * 0.01
    
    # Price risk (distance from entry to stop)
    price_risk_pct = abs(entry_price - stop_loss) / entry_price
    
    # Position size in base currency
    position_value = risk_amount / price_risk_pct
    
    # Apply leverage
    margin_required = position_value / LEVERAGE
    
    return {
        "position_value": round(position_value, 2),
        "margin_required": round(margin_required, 2),
        "risk_amount": round(risk_amount, 2),
        "risk_pct": 1.0,
        "size_coins": round(position_value / entry_price, 6)
    }

def update_stats(sniper_data):
    """Update trading statistics"""
    trades = sniper_data.get('trades', [])
    closed_trades = [t for t in trades if t['status'] == 'closed']
    
    if not closed_trades:
        return sniper_data['stats']
    
    wins = len([t for t in closed_trades if t.get('pnl', 0) > 0])
    losses = len([t for t in closed_trades if t.get('pnl', 0) <= 0])
    total_pnl = sum(t.get('pnl', 0) for t in closed_trades)
    
    # Calculate max drawdown
    equity_curve = [sniper_data.get('starting_balance', 10000)]
    running_pnl = 0
    for trade in closed_trades:
        running_pnl += trade.get('pnl_usd', 0)
        equity_curve.append(sniper_data.get('starting_balance', 10000) + running_pnl)
    
    peak = equity_curve[0]
    max_dd = 0
    for equity in equity_curve:
        if equity > peak:
            peak = equity
        dd = (peak - equity) / peak * 100
        if dd > max_dd:
            max_dd = dd
    
    return {
        "total_trades": len(closed_trades),
        "wins": wins,
        "losses": losses,
        "win_rate": round(wins / len(closed_trades) * 100, 1) if closed_trades else 0,
        "total_pnl": round(total_pnl, 2),
        "avg_trade_pnl": round(total_pnl / len(closed_trades), 2) if closed_trades else 0,
        "max_drawdown": round(max_dd, 2),
        "start_date": sniper_data.get('stats', {}).get('start_date', datetime.datetime.now().isoformat()),
        "leverage": LEVERAGE,
        "position_size_pct": POSITION_SIZE_PCT
    }

def run_sniper_logic():
    print(f"[{datetime.datetime.now()}] Running Sniper Guru Logic...")
    
    # 1. Load State
    sniper_data = load_json(SNIPER_FILE)
    if not sniper_data:
        sniper_data = {
            "trades": [], 
            "balance": 10000, 
            "equity": 10000,
            "starting_balance": 10000,
            "stats": {
                "total_trades": 0,
                "wins": 0,
                "losses": 0,
                "win_rate": 0,
                "total_pnl": 0,
                "avg_trade_pnl": 0,
                "max_drawdown": 0,
                "start_date": datetime.datetime.now().isoformat(),
                "leverage": LEVERAGE,
                "position_size_pct": POSITION_SIZE_PCT
            }
        }
    
    # Ensure starting balance exists
    if 'starting_balance' not in sniper_data:
        sniper_data['starting_balance'] = 10000
    
    active_trades = [t for t in sniper_data.get('trades', []) if t['status'] == 'active']
    closed_trades = [t for t in sniper_data.get('trades', []) if t['status'] == 'closed']
    
    # Calculate current equity
    realized_pnl = sum(t.get('pnl_usd', 0) for t in closed_trades)
    sniper_data['equity'] = sniper_data['starting_balance'] + realized_pnl
    
    # Check if we can open new positions
    if len(active_trades) >= MAX_POSITIONS:
        print(f"Max positions reached ({len(active_trades)}/{MAX_POSITIONS}). Managing existing only.")
    else:
        # 2. Check Signals
        new_signals = []
        
        # Check Short Hunter
        sh_data = load_json(SHORT_HUNTER_FILE)
        if sh_data and 'active_trades' in sh_data:
            for symbol, data in sh_data['active_trades'].items():
                if data.get('score', 0) >= MIN_SCORE:
                    sig_id = f"sh-{symbol}-{data.get('signal_time', '')}"
                    if not any(t['id'] == sig_id for t in sniper_data['trades']):
                        new_signals.append({
                            "id": sig_id,
                            "symbol": symbol,
                            "side": "SHORT",
                            "entry_price": data['entry_price'],
                            "stop_loss": data['stop_loss'],
                            "take_profit": data['take_profit'],
                            "score": data['score'],
                            "source": "shortHunter",
                            "entry_time": data.get('signal_time', datetime.datetime.now().isoformat()),
                            "reasons": data.get('reasons', [])
                        })

        # Check Bounty Seeker
        bs_data = load_json(BOUNTY_SEEKER_FILE)
        if bs_data:
            for signal in bs_data.get('last_signals', []):
                if signal.get('confidence_score', 0) >= MIN_SCORE:
                    clean_sym = signal['symbol'].split(':')[0]
                    sig_id = f"bs-{clean_sym}-{signal.get('timestamp', '')}"
                    
                    if not any(t['id'] == sig_id for t in sniper_data['trades']):
                        new_signals.append({
                            "id": sig_id,
                            "symbol": clean_sym,
                            "side": signal['direction'].upper(),
                            "entry_price": signal['entry_price'],
                            "stop_loss": signal['stop_loss'],
                            "take_profit": signal['take_profit'],
                            "score": signal['confidence_score'],
                            "source": "bountySeeker",
                            "entry_time": signal.get('timestamp', datetime.datetime.now().isoformat()),
                            "reasons": signal.get('reasons', [])
                        })

        # Add new trades (up to max limit)
        slots_available = MAX_POSITIONS - len(active_trades)
        for sig in new_signals[:slots_available]:
            print(f"🔥 Sniper Taking Trade: {sig['symbol']} ({sig['side']}) Score: {sig['score']}")
            
            # Calculate position size
            pos_size = calculate_position_size(sniper_data['equity'], sig['entry_price'], sig['stop_loss'])
            
            sig['status'] = 'active'
            sig['sniper_entry_time'] = datetime.datetime.now().isoformat()
            sig['position_size'] = pos_size
            sig['leverage'] = LEVERAGE
            
            sniper_data['trades'].append(sig)
            active_trades.append(sig)
            print(f"   Position: ${pos_size['position_value']} (Margin: ${pos_size['margin_required']}, Size: {pos_size['size_coins']} coins)")

    # 3. Manage Active Trades (TP/SL)
    if active_trades:
        symbols = [t['symbol'] for t in active_trades]
        current_prices = get_current_prices(symbols)
        
        for trade in active_trades:
            curr_price = current_prices.get(trade['symbol'])
            if not curr_price:
                continue
                
            is_long = trade['side'] == 'LONG'
            trade['current_price'] = curr_price
            
            # PnL Calculation
            if is_long:
                pnl_pct = (curr_price - trade['entry_price']) / trade['entry_price']
            else:
                pnl_pct = (trade['entry_price'] - curr_price) / trade['entry_price']
            
            # Store both % and USD PnL
            trade['unrealized_pnl_pct'] = round(pnl_pct * 100, 2)
            trade['unrealized_pnl_lev'] = round(pnl_pct * 100 * LEVERAGE, 2)
            trade['unrealized_pnl_usd'] = round(pnl_pct * trade['position_size']['position_value'], 2)
            
            # Check Hit
            close_trade = False
            reason = ""
            
            if is_long:
                if curr_price >= trade['take_profit']:
                    close_trade = True
                    reason = "TP Hit"
                elif curr_price <= trade['stop_loss']:
                    close_trade = True
                    reason = "SL Hit"
            else: # Short
                if curr_price <= trade['take_profit']:
                    close_trade = True
                    reason = "TP Hit"
                elif curr_price >= trade['stop_loss']:
                    close_trade = True
                    reason = "SL Hit"
            
            if close_trade:
                print(f"Closing Trade {trade['symbol']}: {reason}")
                trade['status'] = 'closed'
                trade['close_price'] = curr_price
                trade['close_time'] = datetime.datetime.now().isoformat()
                trade['close_reason'] = reason
                trade['pnl'] = round(pnl_pct * 100 * LEVERAGE, 2)  # Realized PnL %
                trade['pnl_usd'] = round(pnl_pct * trade['position_size']['position_value'], 2)
                trade['pnl_pct'] = round(pnl_pct * 100, 2)  # Unleveraged %

    # 4. Update stats
    sniper_data['stats'] = update_stats(sniper_data)
    
    # 5. Trim trade history to last 100
    all_trades = sniper_data['trades']
    if len(all_trades) > MAX_TRADE_HISTORY:
        # Keep active trades and most recent closed trades
        active = [t for t in all_trades if t['status'] == 'active']
        closed = [t for t in all_trades if t['status'] == 'closed']
        # Sort closed by close time, keep last (MAX_TRADE_HISTORY - len(active))
        closed.sort(key=lambda x: x.get('close_time', ''), reverse=True)
        keep_closed = closed[:MAX_TRADE_HISTORY - len(active)]
        sniper_data['trades'] = active + keep_closed
        print(f"Trimmed trade history to {len(sniper_data['trades'])} trades (max: {MAX_TRADE_HISTORY})")

    # 6. Save
    sniper_data['lastUpdated'] = datetime.datetime.now().isoformat()
    save_json(SNIPER_FILE, sniper_data)
    print(f"Stats: {sniper_data['stats']['wins']}W/{sniper_data['stats']['losses']}L | Win Rate: {sniper_data['stats']['win_rate']}% | P&L: ${sniper_data['stats']['total_pnl']}")

if __name__ == "__main__":
    print("🎯 Starting Sniper Guru Bot...")
    print(f"   Leverage: {LEVERAGE}x")
    print(f"   Max Positions: {MAX_POSITIONS}")
    print(f"   Position Size: {POSITION_SIZE_PCT}% of equity")
    print(f"   Max Trade History: {MAX_TRADE_HISTORY}")
    
    while True:
        try:
            run_sniper_logic()
        except Exception as e:
            print(f"Sniper loop error: {e}")
        time.sleep(10)
