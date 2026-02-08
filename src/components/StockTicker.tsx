import { TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const COINGECKO_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "dogecoin",
  "cardano",
  "ripple",
  "polkadot",
  "chainlink",
  "avalanche-2",
  "matic-network",
];

const ID_TO_SYMBOL: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  dogecoin: "DOGE",
  cardano: "ADA",
  ripple: "XRP",
  polkadot: "DOT",
  chainlink: "LINK",
  "avalanche-2": "AVAX",
  "matic-network": "MATIC",
};

interface CoinGeckoPrice {
  usd: number;
  usd_24h_change: number;
}

interface CoinGeckoResponse {
  [key: string]: CoinGeckoPrice;
}

const FALLBACK_TICKERS = [
  { symbol: "BTC", price: "64,231.50", change: "+2.4%", up: true },
  { symbol: "ETH", price: "3,452.12", change: "-1.2%", up: false },
  { symbol: "SOL", price: "145.67", change: "+5.7%", up: true },
  { symbol: "AAPL", price: "189.43", change: "+0.8%", up: true },
  { symbol: "TSLA", price: "175.22", change: "-3.1%", up: false },
  { symbol: "NVDA", price: "894.55", change: "+4.2%", up: true },
  { symbol: "DOGE", price: "0.1642", change: "+12.5%", up: true },
  { symbol: "SPY", price: "512.30", change: "+0.3%", up: true },
  { symbol: "QQQ", price: "438.12", change: "-0.5%", up: false },
];

export function StockTicker() {
  const { data: tickers } = useQuery({
    queryKey: ["ticker-data"],
    queryFn: async () => {
      // Use a shorter list of IDs to reduce URL length and potential for failure
      const SHORT_IDS = ["bitcoin", "ethereum", "solana"];
      
      const fetchWithRetry = async (retries = 1, delay = 1000): Promise<CoinGeckoResponse> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${SHORT_IDS.join(
              ","
            )}&vs_currencies=usd&include_24hr_change=true`,
            {
              headers: { 'Accept': 'application/json' },
              mode: 'cors',
              signal: controller.signal,
            }
          );
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            if (response.status === 429) {
              console.warn("StockTicker: Rate limited by CoinGecko");
            }
            throw new Error(`Fetch failed with status: ${response.status}`);
          }
          
          return (await response.json()) as CoinGeckoResponse;
        } catch (err) {
          clearTimeout(timeoutId);

          if (err instanceof Error && err.name === 'AbortError') {
            console.log("StockTicker: API request timed out or aborted");
            return {}; // Return empty object to trigger fallback
          }

          if (retries > 0) {
            console.log(`StockTicker: Retrying API fetch (${retries} left)...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(retries - 1, delay * 2);
          }
          throw err;
        }
      };

      try {
        const data = await fetchWithRetry();
        if (!data) return FALLBACK_TICKERS;
        
        const cryptoTickers = Object.entries(data)
          .filter(([_, info]) => info && typeof info?.usd === 'number')
          .map(([id, info]) => {
            const usd = Number(info?.usd ?? 0);
            return {
              symbol: ID_TO_SYMBOL[id] || id.toUpperCase(),
              price: usd.toLocaleString(undefined, {
                minimumFractionDigits: usd < 1 ? 4 : 2,
                maximumFractionDigits: usd < 1 ? 4 : 2,
              }),
              change: `${(info?.usd_24h_change || 0) > 0 ? "+" : ""}${(info?.usd_24h_change || 0).toFixed(2)}%`,
              up: (info?.usd_24h_change || 0) > 0,
            };
          });

        const mockStocks = [
          { symbol: "AAPL", price: "189.43", change: "+0.8%", up: true },
          { symbol: "TSLA", price: "175.22", change: "-3.1%", up: false },
          { symbol: "NVDA", price: "894.55", change: "+4.2%", up: true },
        ];

        return [...cryptoTickers, ...mockStocks];
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log("StockTicker: Fetch aborted (likely HMR)");
        } else {
          console.error("StockTicker: Error fetching price data:", err);
        }
        return FALLBACK_TICKERS;
      }
    },
    refetchInterval: 300000, // Refresh every 5 minutes instead of 1
    initialData: FALLBACK_TICKERS,
    retry: false, // Handle retries manually in queryFn
  });

  // Always use tickers (either from API or fallback)
  const displayTickers = [...(tickers || FALLBACK_TICKERS), ...(tickers || FALLBACK_TICKERS)];

  if (displayTickers.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-black text-white overflow-hidden border-t border-white/10 h-8">
      <div className="flex items-center h-full relative">
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap flex items-center hover:[animation-play-state:paused] [animation-duration:40s]">
            {displayTickers.map((item, idx) => (
              <div
                key={`${item.symbol}-${idx}`}
                className="inline-flex items-center gap-2 mx-6"
              >
                <span className="font-display text-xs font-bold tracking-wider text-white/40">
                  {item.symbol}
                </span>
                <span className="font-body text-xs font-medium">
                  ${item.price}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-bold ${
                    item.up ? "text-dem" : "text-rep"
                  }`}
                >
                  {item.up ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
