"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConclusionTab } from "./_components/tabs/conclusion";
import { ReturningOrdersTab } from "./_components/tabs/returning-orders";
import { PurchaseFrequencyTab } from "./_components/tabs/purchase-frequency";
import { LoyaltyProgressionTab } from "./_components/tabs/loyalty-progression";
import { CashbackImpactTab } from "./_components/tabs/cashback-impact";
import { BeforeAfterCashbackTab } from "./_components/tabs/before-after-cashback";
import { SeasonalPatternsTab } from "./_components/tabs/seasonal-patterns";
import { AverageOrderValueTab } from "./_components/tabs/average-order-value";
import { OrderProfitTab } from "./_components/tabs/order-profit";
import { ProgramROITab } from "./_components/tabs/program-roi";
import { BreakEvenAnalysisTab } from "./_components/tabs/break-even-analysis";
import { GhostMembersTab } from "./_components/tabs/ghost-members";
import { FurtherInvestigationsTab } from "./_components/tabs/further-investigations";
import { OrderHistoryByCustomerTab } from "./_components/tabs/order-history-by-customer";
import { DataSourceTab } from "./_components/tabs/data-source";
import { ExecutiveSummaryTab } from "./_components/tabs/executive-summary";

interface OrdersData {
  month: string;
  total: number;
  clubCount: number;
  nonClubCount: number;
  revenue: number;
}

interface ComparisonData {
  club: {
    orders: number;
    avgOrderValue: number;
    totalRevenue: number;
  };
  nonClub: {
    orders: number;
    avgOrderValue: number;
    totalRevenue: number;
  };
}

interface SegmentData {
  month: string;
  loyal: number;
  returning: number;
  new: number;
  inactive: number;
}

interface AOVData {
  month: string;
  currency: string;
  avgOrderValue: number;
  clubAOV: number;
  nonClubAOV: number;
}

interface ProfitData {
  month: string;
  revenue: number;
  profit: number;
  productCost: number;
  freightCost: number;
  paymentCost: number;
  clubProfit: number;
  nonClubProfit: number;
  profitMargin: number;
}

interface FrequencyData {
  group: string;
  customerCount: number;
  avgOrders: number;
  medianOrders: number;
  repeatRate: number;
  loyalRate: number;
}

interface FilterOptions {
  countries: string[];
  currencies: string[];
  months: string[];
}

export default function AnalyticsPage() {
  const [ordersData, setOrdersData] = useState<OrdersData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null
  );
  const [segmentData, setSegmentData] = useState<SegmentData[]>([]);
  const [aovData, setAOVData] = useState<AOVData[]>([]);
  const [profitData, setProfitData] = useState<ProfitData[]>([]);
  const [frequencyData, setFrequencyData] = useState<FrequencyData[] | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    countries: [],
    currencies: [],
    months: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (countryCode && countryCode !== "all")
      params.set("countryCode", countryCode);
    if (currencyCode && currencyCode !== "all")
      params.set("currencyCode", currencyCode);
    return params.toString();
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const queryString = buildQueryString();

    try {
      const [
        ordersRes,
        comparisonRes,
        segmentsRes,
        aovRes,
        profitRes,
        frequencyRes,
        optionsRes,
      ] = await Promise.all([
        fetch(`/api/analytics/orders?${queryString}`),
        fetch(`/api/analytics/orders?type=comparison&${queryString}`),
        fetch(`/api/analytics/segments?${queryString}`),
        fetch(`/api/analytics/profit?type=aov&${queryString}`),
        fetch(`/api/analytics/profit?${queryString}`),
        fetch(`/api/analytics/frequency`),
        fetch(`/api/analytics/segments?type=options`),
      ]);

      if (ordersRes.ok) setOrdersData(await ordersRes.json());
      if (comparisonRes.ok) setComparisonData(await comparisonRes.json());
      if (segmentsRes.ok) setSegmentData(await segmentsRes.json());
      if (aovRes.ok) setAOVData(await aovRes.json());
      if (profitRes.ok) setProfitData(await profitRes.json());
      if (frequencyRes.ok) setFrequencyData(await frequencyRes.json());
      if (optionsRes.ok) setFilterOptions(await optionsRes.json());
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, countryCode, currencyCode]);

  // Debounce filter changes to prevent rapid-fire API requests
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout for debounced fetch
    debounceTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, 300);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchData]);

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setCountryCode("");
    setCurrencyCode("");
  };

  const tabs = [
    { value: "executive-summary", label: "Executive Summary" },
    { value: "conclusion", label: "Conclusion" },
    { value: "returning-orders", label: "H1: Returning Orders" },
    { value: "purchase-frequency", label: "H2: Purchase Freq" },
    { value: "loyalty-progression", label: "H3: Loyalty" },
    { value: "cashback-impact", label: "H4: Cashback" },
    { value: "before-after", label: "H5: Before/After" },
    { value: "seasonal", label: "H6: Seasonal" },
    { value: "aov", label: "H7: AOV" },
    { value: "profit", label: "H8: Profit" },
    { value: "roi", label: "H9: ROI" },
    { value: "break-even", label: "Break-Even" },
    { value: "ghost-members", label: "Ghost Members" },
    { value: "investigations", label: "Further Analysis" },
    { value: "order-history", label: "Order History" },
    { value: "data", label: "Data Source" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-50 border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <h1 className="text-xl font-semibold">Trendhim Club Analytics</h1>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto p-4">
        <main className="space-y-6">
          <Tabs defaultValue="executive-summary" className="w-full">
            <TabsList className="w-full flex-wrap justify-start gap-1 h-auto p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="executive-summary" className="mt-6">
              <ExecutiveSummaryTab />
            </TabsContent>

            <TabsContent value="conclusion" className="mt-6">
              <ConclusionTab />
            </TabsContent>

            <TabsContent value="returning-orders" className="mt-6">
              <ReturningOrdersTab
                ordersData={ordersData}
                comparisonData={comparisonData}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="purchase-frequency" className="mt-6">
              <PurchaseFrequencyTab
                frequencyData={frequencyData}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="loyalty-progression" className="mt-6">
              <LoyaltyProgressionTab
                segmentData={segmentData}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="cashback-impact" className="mt-6">
              <CashbackImpactTab isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="before-after" className="mt-6">
              <BeforeAfterCashbackTab isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="seasonal" className="mt-6">
              <SeasonalPatternsTab
                ordersData={ordersData}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="aov" className="mt-6">
              <AverageOrderValueTab aovData={aovData} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="profit" className="mt-6">
              <OrderProfitTab profitData={profitData} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="roi" className="mt-6">
              <ProgramROITab isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="break-even" className="mt-6">
              <BreakEvenAnalysisTab />
            </TabsContent>

            <TabsContent value="ghost-members" className="mt-6">
              <GhostMembersTab />
            </TabsContent>

            <TabsContent value="investigations" className="mt-6">
              <FurtherInvestigationsTab />
            </TabsContent>

            <TabsContent value="order-history" className="mt-6">
              <OrderHistoryByCustomerTab />
            </TabsContent>

            <TabsContent value="data" className="mt-6">
              <DataSourceTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
