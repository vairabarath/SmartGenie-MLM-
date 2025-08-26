import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface PriceContextType {
  bnbToUsd: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshPrice: () => Promise<void>;
}

interface PriceProviderProps {
  children: ReactNode;
}

export const PriceContext = createContext<PriceContextType | null>(null);

export const PriceProvider: React.FC<PriceProviderProps> = ({ children }) => {
  const [bnbToUsd, setBnbToUsd] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBNBPrice = async (): Promise<number> => {
    const apis = [
      {
        url: "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd",
        parseResponse: (data: any) => data.binancecoin?.usd,
      },
      {
        url: "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT",
        parseResponse: (data: any) => parseFloat(data.price),
      },
      // CoinMarketCap API (requires API key, so commented out)
      // {
      //   url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BNB',
      //   parseResponse: (data: any) => data.data?.BNB?.quote?.USD?.price
      // }
    ];

    for (const api of apis) {
      try {
        console.log(`Fetching BNB price from: ${api.url}`);

        const response = await fetch(api.url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const price = api.parseResponse(data);

        if (price && typeof price === "number" && price > 0) {
          console.log(`BNB price fetched successfully: $${price}`);
          return price;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${api.url}:`, error);
        continue;
      }
    }

    // If all APIs fail, throw an error
    throw new Error("All price APIs failed");
  };

  const refreshPrice = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const price = await fetchBNBPrice();
      setBnbToUsd(price);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error("Error fetching BNB price:", err);
      setError(err.message || "Failed to fetch BNB price");

      // Set a fallback price if we don't have any price yet
      if (bnbToUsd === 0) {
        setBnbToUsd(600); // Reasonable fallback price
        console.warn("Using fallback BNB price: $600");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial price fetch
    refreshPrice();

    const interval = setInterval(() => {
      refreshPrice();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const value: PriceContextType = {
    bnbToUsd,
    isLoading,
    error,
    lastUpdated,
    refreshPrice,
  };

  return (
    <PriceContext.Provider value={value}>{children}</PriceContext.Provider>
  );
};
