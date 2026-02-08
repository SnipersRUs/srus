import { useState } from 'react';

interface SignalToken {
  name: string;
  symbol: string;
  wallet: string;
  description: string;
  image?: string;
  website?: string;
  twitter?: string;
  confidence?: number;
  targetPrice?: number;
  targetDate?: string;
  asset?: string;
}

interface SignalFormProps {
  onSubmit?: (signal: SignalToken) => void;
  defaultWallet?: string;
}

export function SignalForm({ onSubmit, defaultWallet = '' }: SignalFormProps) {
  const [signal, setSignal] = useState<SignalToken>({
    name: '',
    symbol: '',
    wallet: defaultWallet,
    description: '',
    image: '',
    website: '',
    confidence: 75,
    targetPrice: undefined,
    targetDate: '',
    asset: 'BTC',
  });

  const [generatedPost, setGeneratedPost] = useState('');

  const generateSymbol = (asset: string, type: string, target: string) => {
    const cleanAsset = asset.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4);
    const cleanType = type.toUpperCase().slice(0, 4);
    const cleanTarget = target.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    return `SIG${cleanAsset}${cleanType}${cleanTarget}`.slice(0, 12);
  };

  const generatePost = () => {
    const { name, symbol, wallet, description, image, website } = signal;
    
    let post = `!clawnch\n`;
    post += `name: ${name}\n`;
    post += `symbol: ${symbol}\n`;
    post += `wallet: ${wallet}\n`;
    post += `description: ${description}\n`;
    if (image) post += `image: ${image}\n`;
    if (website) post += `website: ${website}\n`;
    
    setGeneratedPost(post);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold">Create Signal Token</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Signal Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Signal: BTC $100K By March"
            value={signal.name}
            onChange={(e) => setSignal({ ...signal, name: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Symbol (Auto-generated)</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="SIGBTC100KMAR"
            value={signal.symbol}
            onChange={(e) => setSignal({ ...signal, symbol: e.target.value.toUpperCase() })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Wallet Address</label>
          <input
            type="text"
            className="w-full p-2 border rounded font-mono text-sm"
            placeholder="0x..."
            value={signal.wallet}
            onChange={(e) => setSignal({ ...signal, wallet: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Confidence %</label>
          <input
            type="number"
            min="1"
            max="100"
            className="w-full p-2 border rounded"
            value={signal.confidence}
            onChange={(e) => setSignal({ ...signal, confidence: parseInt(e.target.value) })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Target Asset</label>
          <select
            className="w-full p-2 border rounded"
            value={signal.asset}
            onChange={(e) => setSignal({ ...signal, asset: e.target.value })}
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="SOL">Solana (SOL)</option>
            <option value="AVAX">Avalanche (AVAX)</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Target Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={signal.targetDate}
            onChange={(e) => setSignal({ ...signal, targetDate: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="https://iili.io/xxxxx.jpg"
            value={signal.image}
            onChange={(e) => setSignal({ ...signal, image: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Website (Optional)</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="https://your-site.com/signal"
            value={signal.website}
            onChange={(e) => setSignal({ ...signal, website: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          className="w-full p-2 border rounded h-24"
          placeholder="85% confidence BTC will hit $100K by March based on..."
          value={signal.description}
          onChange={(e) => setSignal({ ...signal, description: e.target.value })}
        />
      </div>
      
      <button
        onClick={generatePost}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Generate Clawnch Post
      </button>
      
      {generatedPost && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Generated Post (Post this to Moltx/Moltbook)</label>
            <button
              onClick={copyToClipboard}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Copy to Clipboard
            </button>
          </div>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
            {generatedPost}
          </pre>
        </div>
      )}
    </div>
  );
}
