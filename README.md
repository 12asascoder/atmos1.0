# 

🌍 MODULE 1: Global Competitor Ad Surveillance Engine

## 🏗 Root Project Structure
snitch-marketing-os/
├── frontend/        # Next.js / React app (dashboard)
├── backend/         # API, database, queues, scrapers
├── docker/          # (optional) Docker configs
├── scripts/         # helper scripts (seed, deploy, etc.)
├── .env             # root env (or .env.local)
├── package.json
└── README.md


## 🎨 frontend/ – UI for dashboard
### Components and Pages for CommandCenter page
#### Pages
- CommandCenter.tsx

#### Components
- ChatInput.tsx
- Header.tsx
- InsightCard.tsx
- MessageBubble.tsx
- Navigation.tsx
- QuickAction.tsx
- StatusBadge.tsx
- GenerateAdPopup.tsx

### API calls to backend for CommandCenter
- ChatInput.tsx -> http://localhost:5001/genai_call (/backend/app/api/commandCenter/api_call.py)
- GenerateAdPopup.tsx -> http://localhost:5002/image_gen (/backend/app/api/commandCenter/generate_ad.py)

### Components and Pages for Login and Signup
#### Pages
- Login.tsx
- Signup.tsx

#### Components
- Login-form.tsx
- Signup-form.tsx
- ProtectedRoute.tsx (in case someone directly types /command-center without logging in it redirects to login page)

### API calls to backend for Authentication
- Signup-form.tsx -> http://localhost:5003/sign-up(/backend/app/api/Authentication/auth.py)
- Login-form.tsx -> http://localhost:5003/login(/backend/app/api/Authentication/auth.py)

frontend/
├── public/                  # static assets (logos, icons, fonts)
├── src/
│   ├── app/ or pages/       # Next.js routes (depends on version)
│   │   ├── layout.tsx
│   │   ├── page.tsx         # main dashboard
│   │   ├── competitors/
│   │   │   ├── page.tsx     # list competitors
│   │   │   └── [id]/        # competitor detail
│   │   │       └── page.tsx # ads, metrics
│   │   ├── ads/
│   │   │   └── page.tsx     # global ad feed
│   │   ├── alerts/
│   │   │   └── page.tsx     # alerts feed
│   │   └── auth/            # login/signup if needed
│   │
│   ├── components/          # reusable UI components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── Card.tsx
│   │   ├── charts/
│   │   │   ├── PlatformDistributionChart.tsx
│   │   │   └── SpendTrendChart.tsx
│   │   ├── competitors/
│   │   │   ├── CompetitorCard.tsx
│   │   │   └── CompetitorForm.tsx
│   │   ├── ads/
│   │   │   ├── AdCard.tsx
│   │   │   └── AdFilters.tsx
│   │   └── alerts/
│   │       └── AlertList.tsx
│   │
│   ├── features/            # logic grouped by feature
│   │   ├── competitors/
│   │   │   ├── api.ts       # calls backend /competitors
│   │   │   ├── hooks.ts     # useCompetitors(), etc.
│   │   │   └── types.ts
│   │   ├── ads/
│   │   │   ├── api.ts       # /ads endpoints
│   │   │   ├── hooks.ts
│   │   │   └── types.ts
│   │   ├── alerts/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   └── types.ts
│   │   └── auth/
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── axiosClient.ts   # API client config
│   │   ├── config.ts        # base URLs, constants
│   │   └── utils.ts         # small helpers
│   │
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── global.ts
│
├── .env.local
├── package.json
└── tsconfig.json


## ⚙️ backend/ – API, DB, Jobs, Scrapers

backend/
├── app/
│   ├── main.py               # FastAPI app entrypoint
│   ├── core/                 # core config & setup
│   │   ├── config.py         # settings (env vars)
│   │   ├── database.py       # DB engine & session
│   │   ├── logging.py        # logging config
│   │   └── security.py       # (if you add auth later)
│   │
│   ├── models/               # SQLAlchemy / SQLModel tables
│   │   ├── user.py
│   │   ├── competitor.py     # competitors table
│   │   ├── ad.py             # competitor_ads table
│   │   └── spend.py          # spend_estimates table
│   │
│   ├── schemas/              # Pydantic models (request/response)
│   │   ├── user.py
│   │   ├── competitor.py
│   │   ├── ad.py
│   │   └── spend.py
│   │
│   ├── api/                  # API routers
│   │   ├── deps.py           # common dependencies (DB session, auth)
│   │   └── v1/
│   │       ├── router.py     # include all v1 routes
│   │       ├── competitors.py  # /competitors
│   │       ├── ads.py          # /ads
│   │       ├── summary.py      # /competitors/summary (cards)
│   │       ├── alerts.py       # /alerts
│   │       └── health.py       # /health
│   │
│   ├── services/             # business logic (no FastAPI stuff)
│   │   ├── competitor_service.py
│   │   ├── ad_service.py         # active ads, filters
│   │   ├── spend_service.py      # estimated spend + distribution
│   │   └── alert_service.py      # alert rules
│   │
│   ├── workers/              # background processes (Celery/RQ)
│   │   ├── __init__.py
│   │   ├── scraping/
│   │   │   ├── meta_worker.py    # Meta Ad Library fetch
│   │   │   ├── google_worker.py  # Google ad fetch
│   │   │   ├── tiktok_worker.py  # (scraper)
│   │   │   └── common.py         # shared helpers
│   │   ├── landing_page_worker.py # screenshots + HTML
│   │   └── alert_worker.py       # weekly/daily checks for surges etc.
│   │
│   ├── integrations/         # external APIs & scraping
│   │   ├── meta_client.py    # low-level Meta Ad Library client
│   │   ├── google_client.py
│   │   └── http_client.py    # shared HTTP wrapper (httpx/requests)
│   │
│   ├── scraping/             # Playwright/selenium logic if you want separated
│   │   ├── meta_scraper.py
│   │   ├── google_scraper.py
│   │   └── tiktok_scraper.py
│   │
│   ├── storage/              # S3 or similar
│   │   ├── s3_client.py
│   │   └── file_service.py
│   │
│   └── utils/                # small tools
│       ├── hashing.py        # landing page hash for redesign detection
│       ├── time.py
│       └── cpm_tables.py     # CPM constants for spend estimation
│
├── migrations/               # Alembic migrations
├── tests/
│   ├── test_competitors.py
│   └── test_ads.py
├── requirements.txt / pyproject.toml
└── .env.example



## We’ll make competitor management work end‑to‑end:

POST /api/v1/competitors → add competitor

GET /api/v1/competitors → list competitors

DELETE /api/v1/competitors/{id} → delete competitor

Stack: FastAPI + SQLAlchemy + Postgres (Supabase)

## app/core/config.py - Read your DB connection string from .env so you don’t hardcode passwords.

## app/core/database.py
👉 Simple idea:

engine = connection to database

SessionLocal = “open a tab” to DB

Base = parent for all DB models

get_db() = FastAPI’s way to give you a DB session inside your endpoints.

## app/models/competitor.py -  DB table model
👉 Simple idea:
This class = one row in competitors table.
Fields match what we discussed: domain, brand name, social handles, etc.

## app/schemas/competitor.py – Request/Response shapes
👉 Simple idea:

CompetitorCreate = data your frontend sends when adding a competitor

CompetitorResponse = data your API sends back

Keeps request/responses clean and typed.

## app/services/competitor_service.py – business logic

👉 Simple idea:
These functions are your “logic layer”:

create_competitor – puts a new competitor row into DB

list_competitors – returns all competitors (optionally filtered by user)

delete_competitor – removes a competitor row

## app/api/v1/competitors.py – FastAPI endpoints
👉 Simple idea in words:

POST /competitors

Input: JSON with name, domain, social_handles…

Uses create_competitor → saves in DB → returns the saved row.

GET /competitors

Reads from DB → returns list of competitors.

DELETE /competitors/{id}

Looks for competitor in DB

If exists → delete

If not → send 404 error.

## app/api/v1/router.py – main API router

👉 Simple idea:
This collects all v1 endpoints in one place. Later you’ll add ads, summary, alerts routers here too.

## app/main.py – FastAPI app entry
👉 Simple idea:

Creates FastAPI app

Makes sure tables exist (dev mode)

Adds CORS so your frontend can call it

Mounts all v1 endpoints under /api/v1

Gives you a test root / endpoint.

uvicorn app.main:app --reload

python terminal.py



// import React, { useState, useEffect, useCallback } from "react";
// import {
//   TrendingUp,
//   TrendingDown,
//   Activity,
//   Target,
//   Eye,
//   MousePointer,
//   BarChart3,
//   Filter,
//   Search,
//   MoreVertical,
//   PlayCircle,
//   Copy,
//   Download,
//   Wifi,
//   WifiOff,
//   RefreshCw,
//   Plus,
//   X,
//   AlertCircle,
//   Calendar,
//   Clock,
//   PieChart as PieChartIcon,
//   BarChart as BarChartIcon,
//   LineChart as LineChartIcon,
//   Radar,
//   User,
//   Shield,
//   Zap,
//   Users,
//   DollarSign,
//   Percent,
//   Globe,
//   Sparkles,
//   AlertTriangle,
//   Info,
//   ExternalLink,
//   BarChart2,
//   Layers,
//   Target as TargetIcon,
//   PieChart,
//   LineChart,
//   ScatterChart,
//   Image as ImageIcon,
//   Link as LinkIcon,
//   Hash,
//   MapPin,
//   Smartphone,
//   Clock as ClockIcon,
//   Users as UsersIcon,
//   ChevronDown,
//   ChevronUp,
//   Download as DownloadIcon,
//   Share2,
//   BarChart3 as BarChart3Icon,
//   Globe as GlobeIcon,
//   Cpu,
//   TrendingUp as TrendingUpIcon,
//   Lightbulb,
//   AlertOctagon,
//   Award,
//   Target as TargetIcon2,
//   ChartBar,
//   ChartLine,
//   ChartPie,
//   ChartArea,
//   ChartScatter,
//   Heart,
//   MessageCircle,
//   Youtube,
//   Facebook,
//   Instagram,
//   Linkedin,
//   Loader2,
// } from "lucide-react";

// // Import Recharts components
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   PieChart as RechartsPieChart,
//   Pie,
//   Cell,
//   LineChart as RechartsLineChart,
//   Line,
//   ComposedChart,
//   ScatterChart as RechartsScatterChart,
//   Scatter,
//   ZAxis,
//   RadarChart,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
//   AreaChart,
//   Area,
//   RadialBarChart,
//   RadialBar,
//   Treemap,
// } from "recharts";

// // Import API services with types
// import {
//   UsersAPI,
//   CompetitorsAPI,
//   AdsAPI,
//   PlatformsAPI,
//   MetricsAPI,
//   SummaryAPI,
//   TrendingAPI,
//   MetricsData,
//   MetricsSummary,
//   PlatformStats,
//   TrendingAd as TrendingAdType,
//   TrendingSearchResponse,
//   parseSpendValue,
//   parseImpressionValue,
//   normalizeTrendingAd,
// } from "../services/Sample_1_adsurv";

// interface UserInfo {
//   user_id: string;
//   email: string;
//   name: string;
//   business_type?: string;
//   industry?: string;
//   goals?: string;
// }

// interface Competitor {
//   id: string;
//   name: string;
//   domain?: string;
//   industry?: string;
//   estimated_monthly_spend?: number;
//   created_at: string;
//   ads_count: number;
//   last_fetched_at?: string;
//   is_active: boolean;
//   user_id: string;
//   last_fetch_status: string;
// }

// interface AdData {
//   id: string;
//   competitor_id: string;
//   competitor_name: string;
//   platform: string;
//   headline: string;
//   description: string;
//   full_text: string;
//   destination_url: string;
//   image_url: string;
//   video_url: string;
//   format: string;
//   impressions: string | number;
//   spend: number;
//   is_active: boolean;
//   first_seen: string;
//   last_seen: string;
//   platform_ad_id?: string;
//   created_at?: string;
// }

// interface SummaryMetrics {
//   total_competitor_spend: number;
//   active_campaigns: number;
//   total_impressions: number;
//   avg_ctr: number;
//   total_competitors: number;
//   platform_distribution: Record<string, number>;
// }

// interface AnalyticsData {
//   competitorSpend: any[];
//   spendRanges: any[];
//   ctrPerformance: any[];
//   spendImpressions: any[];
//   platformCTR: any[];
// }

// interface TrendingAdWithEngagement extends TrendingAdType {
//   engagement_score: number;
//   competitor_name?: string;
// }

// interface MetricsOverview {
//   totalCompetitors: number;
//   totalAdsTracked: number;
//   totalSpend: number;
//   avgCtr: number;
//   topPerformers: MetricsSummary[];
// }

// // Platform icon mapping
// const platformIcons: Record<string, React.ReactNode> = {
//   meta: <Facebook className="w-3.5 h-3.5" />,
//   facebook: <Facebook className="w-3.5 h-3.5" />,
//   instagram: <Instagram className="w-3.5 h-3.5" />,
//   youtube: <Youtube className="w-3.5 h-3.5" />,
//   linkedin: <Linkedin className="w-3.5 h-3.5" />,
//   reddit: <Globe className="w-3.5 h-3.5" />, // Change Reddit to Globe
//   tiktok: <Instagram className="w-3.5 h-3.5" />, // Using Instagram icon as fallback
//   google: <Globe className="w-3.5 h-3.5" />,
//   twitter: <Globe className="w-3.5 h-3.5" />,
//   pinterest: <Globe className="w-3.5 h-3.5" />,
// };

// const AdSurveillance = () => {
//   // User state
//   const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   // Competitors state
//   const [competitors, setCompetitors] = useState<Competitor[]>([]);
//   const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(
//     null,
//   );
//   const [showAddCompetitor, setShowAddCompetitor] = useState(false);
//   const [newCompetitor, setNewCompetitor] = useState({
//     name: "",
//     domain: "",
//     industry: "",
//     estimated_monthly_spend: 0,
//   });

//   // Ads state
//   const [ads, setAds] = useState<AdData[]>([]);
//   const [filteredAds, setFilteredAds] = useState<AdData[]>([]);
//   const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedCompany, setSelectedCompany] = useState<string>("all");

//   // Metrics state
//   const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics | null>(
//     null,
//   );
//   const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
//   const [selectedPeriod, setSelectedPeriod] = useState<
//     "daily" | "weekly" | "monthly" | "all_time"
//   >("weekly");
//   const [allMetrics, setAllMetrics] = useState<MetricsData[]>([]);
//   const [metricsSummary, setMetricsSummary] = useState<MetricsSummary[]>([]);
//   const [metricsOverview, setMetricsOverview] =
//     useState<MetricsOverview | null>(null);
//   const [selectedMetrics, setSelectedMetrics] = useState<MetricsData | null>(
//     null,
//   );
//   const [isCalculatingMetrics, setIsCalculatingMetrics] = useState(false);

//   // View modes
//   const [dataViewMode, setDataViewMode] = useState<"latest" | "historical">(
//     "latest",
//   );
//   const [expandedSections, setExpandedSections] = useState<
//     Record<string, boolean>
//   >({
//     financial: true,
//     performance: true,
//     audience: true,
//     strategic: true,
//     platform: true,
//     recommendations: true,
//   });

//   // Analytics state
//   const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
//     null,
//   );
//   const [activeChart, setActiveChart] = useState("overview");
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Trending ads state
//   const [trendingAds, setTrendingAds] = useState<TrendingAdWithEngagement[]>(
//     [],
//   );
//   const [isLoadingTrending, setIsLoadingTrending] = useState(false);
//   const [trendingSearchResult, setTrendingSearchResult] =
//     useState<TrendingSearchResponse | null>(null);
//   const [trendingSearchKeyword, setTrendingSearchKeyword] = useState("");
//   const [selectedTrendingPlatforms, setSelectedTrendingPlatforms] = useState<
//     string[]
//   >(["meta", "instagram", "youtube"]);
//   const [isSearchingTrending, setIsSearchingTrending] = useState(false);
//   const [showTrendingSearch, setShowTrendingSearch] = useState(false);

//   // Error state
//   const [error, setError] = useState<string | null>(null);

//   // Initialize
//   useEffect(() => {
//     checkAuthAndLoadData();
//   }, []);

//   // Check authentication and load initial data
//   const checkAuthAndLoadData = async () => {
//     try {
//       const userData = await UsersAPI.getMe();
//       setUserInfo(userData);
//       setIsAuthenticated(true);

//       await loadCompetitors();
//     } catch (error) {
//       console.error("Authentication error:", error);
//       setIsAuthenticated(false);
//       setError("Please login to access AdSurv Intelligence");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Load competitors
//   const loadCompetitors = async () => {
//     try {
//       console.log("Loading competitors...");
//       const data = await CompetitorsAPI.list();
//       console.log("Competitors API response:", data);

//       let competitorsList: Competitor[] = [];

//       if (Array.isArray(data)) {
//         competitorsList = data;
//       }

//       console.log("Processed competitors:", competitorsList.length);
//       setCompetitors(competitorsList);

//       // Load data that depends on competitors
//       if (competitorsList.length > 0) {
//         await Promise.all([
//           loadSummaryMetrics(),
//           loadPlatformStats(),
//           loadRecentAds(),
//           loadTrendingAds(),
//           loadMetricsSummary(),
//           loadMetricsOverview(),
//         ]);
//       }
//     } catch (error) {
//       console.error("Error loading competitors:", error);
//       setError("Failed to load competitors. Please try again.");
//     }
//   };

//   // Load metrics summary
//   const loadMetricsSummary = async () => {
//     try {
//       console.log("Loading metrics summary...");
//       const data = await MetricsAPI.summary();
//       console.log("Metrics summary API response:", data);
//       if (Array.isArray(data)) {
//         setMetricsSummary(data);
//         // Use first metric as selected if available
//         if (data.length > 0 && data[0]) {
//           // Transform summary item to full metrics
//           const firstMetric = data[0];
//           const metricData: MetricsData = {
//             id: "",
//             competitor_id: firstMetric.competitor_id,
//             competitor_name: firstMetric.competitor_name,
//             calculated_at: firstMetric.last_calculated,
//             time_period: "weekly",
//             start_date: "",
//             end_date: "",
//             total_ads: 0,
//             active_ads: firstMetric.active_ads,
//             ads_per_platform: {},
//             estimated_daily_spend: 0,
//             estimated_weekly_spend: 0,
//             estimated_monthly_spend: parseSpendValue(
//               firstMetric.estimated_monthly_spend,
//             ),
//             total_spend: 0,
//             avg_cpm: 0,
//             avg_cpc: 0,
//             avg_ctr: parseFloat(firstMetric.avg_ctr) || 0,
//             avg_frequency: 0,
//             conversion_probability: 0,
//             creative_performance: {},
//             top_performing_creatives: [],
//             funnel_stage_distribution: {},
//             audience_clusters: [],
//             geo_penetration: {},
//             device_distribution: {},
//             time_of_day_heatmap: {},
//             ad_timeline: [],
//             trends: {},
//             recommendations: [],
//             risk_score: firstMetric.risk_score,
//             opportunity_score: firstMetric.opportunity_score,
//             created_at: "",
//             updated_at: "",
//           };
//           setSelectedMetrics(metricData);
//         }
//       }
//     } catch (error) {
//       console.error("Error loading metrics summary:", error);
//     }
//   };

//   // Load metrics overview
//   const loadMetricsOverview = async () => {
//     try {
//       console.log("Loading metrics overview...");
//       const data = await MetricsAPI.getMetricsOverview();
//       console.log("Metrics overview API response:", data);
//       setMetricsOverview(data);
//     } catch (error) {
//       console.error("Error loading metrics overview:", error);
//       // Create fallback overview
//       setMetricsOverview({
//         totalCompetitors: competitors.length,
//         totalAdsTracked: ads.length,
//         totalSpend: summaryMetrics?.total_competitor_spend || 0,
//         avgCtr: summaryMetrics?.avg_ctr || 0,
//         topPerformers: [],
//       });
//     }
//   };

//   // Load summary metrics
//   const loadSummaryMetrics = async () => {
//     try {
//       console.log("Loading summary metrics...");
//       const data = await SummaryAPI.dashboard();
//       console.log("Summary API response:", data);

//       if (data && typeof data === "object") {
//         setSummaryMetrics({
//           total_competitor_spend: data.total_competitor_spend || 0,
//           active_campaigns: data.active_campaigns || 0,
//           total_impressions: data.total_impressions || 0,
//           avg_ctr: data.avg_ctr || 0,
//           total_competitors: data.total_competitors || competitors.length,
//           platform_distribution: data.platform_distribution || {},
//         });
//       }
//     } catch (error) {
//       console.error("Error loading summary metrics:", error);
//       // Fallback to default values
//       setSummaryMetrics({
//         total_competitor_spend: 0,
//         active_campaigns: 0,
//         total_impressions: 0,
//         avg_ctr: 0,
//         total_competitors: competitors.length,
//         platform_distribution: {},
//       });
//     }
//   };

//   // Load platform statistics
//   const loadPlatformStats = async () => {
//     try {
//       console.log("Loading platform stats...");
//       const response = await MetricsAPI.platformStats();
//       console.log("Platform stats API response:", response);

//       let processedStats: PlatformStats[] = [];

//       const colors = [
//         "#00C2B3",
//         "#4A90E2",
//         "#FF6B6B",
//         "#FFD166",
//         "#9B59B6",
//         "#2ECC71",
//       ];

//       // Handle different response formats
//       if (response && typeof response === "object") {
//         // If response is already an array
//         if (Array.isArray(response)) {
//           processedStats = response.map((platform: any, index: number) => ({
//             platform:
//               platform.platform || platform.name || `Platform ${index + 1}`,
//             ad_count: platform.ad_count || platform.ads_count || 0,
//             total_spend: platform.total_spend || 0,
//             avg_ctr: platform.avg_ctr || 0,
//             percentage: platform.percentage || 0,
//             color: platform.color || colors[index % colors.length],
//           }));
//         } else if (typeof response === "string") {
//           // If response is a string (JSON), parse it
//           try {
//             const parsed = JSON.parse(response);
//             if (Array.isArray(parsed)) {
//               processedStats = parsed.map((platform: any, index: number) => ({
//                 platform:
//                   platform.platform || platform.name || `Platform ${index + 1}`,
//                 ad_count: platform.ad_count || platform.ads_count || 0,
//                 total_spend: platform.total_spend || 0,
//                 avg_ctr: platform.avg_ctr || 0,
//                 percentage: platform.percentage || 0,
//                 color: platform.color || colors[index % colors.length],
//               }));
//             }
//           } catch (parseError) {
//             console.error("Error parsing platform stats:", parseError);
//           }
//         }
//       }

//       console.log("Processed platform stats:", processedStats);
//       setPlatformStats(processedStats);
//     } catch (error) {
//       console.error("Error loading platform stats:", error);
//       // Keep empty array if no data
//       setPlatformStats([]);
//     }
//   };

//   // Load recent ads
//   const loadRecentAds = async (competitorId?: string) => {
//     try {
//       console.log("Loading recent ads...");
//       let adsData: AdData[] = [];

//       if (competitorId) {
//         const data = await AdsAPI.getCompetitorAds(
//           competitorId,
//           undefined,
//           100,
//         );
//         console.log("Competitor ads API response:", data);

//         if (Array.isArray(data)) {
//           adsData = data.map((ad) => {
//             // Parse spend and impressions safely
//             const parsedSpend = parseSpendValue(ad.spend);
//             const parsedImpressions = parseImpressionValue(ad.impressions);

//             return {
//               ...ad,
//               competitor_name: ad.competitor_name || "",
//               impressions: parsedImpressions,
//               spend: parsedSpend,
//             };
//           });
//         }
//       } else {
//         // Load ads from all competitors
//         for (const comp of competitors) {
//           try {
//             const data = await AdsAPI.getCompetitorAds(comp.id, undefined, 20);
//             let compAds: AdData[] = [];

//             if (Array.isArray(data)) {
//               compAds = data.map((ad) => {
//                 // Parse spend and impressions safely
//                 const parsedSpend = parseSpendValue(ad.spend);
//                 const parsedImpressions = parseImpressionValue(ad.impressions);

//                 return {
//                   ...ad,
//                   competitor_name: comp.name,
//                   impressions: parsedImpressions,
//                   spend: parsedSpend,
//                 };
//               });
//             }

//             adsData.push(...compAds);
//           } catch (error) {
//             console.error(
//               `Error loading ads for competitor ${comp.name}:`,
//               error,
//             );
//           }
//         }
//       }

//       // Sort by last_seen date (newest first)
//       adsData.sort((a, b) => {
//         const dateA = a.last_seen || a.created_at || "";
//         const dateB = b.last_seen || b.created_at || "";
//         return new Date(dateB).getTime() - new Date(dateA).getTime();
//       });

//       console.log("Loaded ads:", adsData.length);
//       setAds(adsData);
//       setFilteredAds(adsData);
//     } catch (error) {
//       console.error("Error loading ads:", error);
//       setError("Failed to load ads. Please try refreshing.");
//     }
//   };

//   // Load trending ads - UPDATED: Using new TrendingAPI.search directly
//   const loadTrendingAds = async () => {
//     try {
//       setIsLoadingTrending(true);
//       setTrendingAds([]);
//       setTrendingSearchResult(null);

//       // Get competitor names for trending search
//       const competitorNames = competitors.map((c) => c.name);

//       if (competitorNames.length === 0) {
//         // If no competitors, search for trending keywords
//         try {
//           const result = await TrendingAPI.search({
//             keyword: trendingSearchKeyword || "technology ecommerce",
//             platforms: selectedTrendingPlatforms,
//             limit_per_platform: 5,
//             async_mode: false,
//           });

//           setTrendingSearchResult(result);

//           if (result.top_trending && Array.isArray(result.top_trending)) {
//             const trendingData = result.top_trending
//               .slice(0, 5)
//               .map((item: TrendingAdType) => ({
//                 ...item,
//                 engagement_score: calculateEngagementScore(item),
//               }));
//             setTrendingAds(trendingData);
//           }
//         } catch (searchError) {
//           console.error("Error in trending search:", searchError);
//           // Don't show error for trending - it's optional
//         }
//       } else {
//         // Use the helper function to get trending for competitors
//         try {
//           const trendingResults =
//             await TrendingAPI.getTrendingForCompetitors(competitorNames);

//           if (trendingResults.length > 0) {
//             const processedTrending = trendingResults.map((item) => ({
//               ...item,
//               engagement_score: calculateEngagementScore(item),
//             }));
//             setTrendingAds(processedTrending);
//           }
//         } catch (searchError) {
//           console.error("Error getting trending for competitors:", searchError);
//           // Fallback to generic search
//           try {
//             const result = await TrendingAPI.search({
//               keyword: "advertising trends",
//               platforms: selectedTrendingPlatforms,
//               limit_per_platform: 5,
//               async_mode: false,
//             });

//             setTrendingSearchResult(result);

//             if (result.top_trending && Array.isArray(result.top_trending)) {
//               const trendingData = result.top_trending
//                 .slice(0, 5)
//                 .map((item: TrendingAdType) => ({
//                   ...item,
//                   engagement_score: calculateEngagementScore(item),
//                 }));
//               setTrendingAds(trendingData);
//             }
//           } catch (fallbackError) {
//             console.error("Fallback trending search error:", fallbackError);
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error loading trending ads:", error);
//       // Don't set error for trending ads - it's optional
//     } finally {
//       setIsLoadingTrending(false);
//     }
//   };

//   // Handle trending search
//   const handleTrendingSearch = async () => {
//     if (!trendingSearchKeyword.trim()) {
//       setError("Please enter a search keyword");
//       return;
//     }

//     if (selectedTrendingPlatforms.length === 0) {
//       setError("Please select at least one platform");
//       return;
//     }

//     setIsSearchingTrending(true);
//     setError(null);

//     try {
//       const result = await TrendingAPI.search({
//         keyword: trendingSearchKeyword.trim(),
//         platforms: selectedTrendingPlatforms,
//         limit_per_platform: 5,
//         async_mode: false,
//       });

//       setTrendingSearchResult(result);

//       if (result.top_trending && Array.isArray(result.top_trending)) {
//         const trendingData = result.top_trending
//           .slice(0, 10)
//           .map((item: TrendingAdType) => ({
//             ...item,
//             engagement_score: calculateEngagementScore(item),
//           }));
//         setTrendingAds(trendingData);
//       }

//       // Hide search modal if open
//       setShowTrendingSearch(false);
//     } catch (error: any) {
//       console.error("Trending search error:", error);
//       setError(`Trending search failed: ${error.message}`);
//     } finally {
//       setIsSearchingTrending(false);
//     }
//   };

//   // Toggle trending platform selection
//   const toggleTrendingPlatform = (platform: string) => {
//     setSelectedTrendingPlatforms((prev) => {
//       if (prev.includes(platform)) {
//         return prev.filter((p) => p !== platform);
//       } else {
//         return [...prev, platform];
//       }
//     });
//   };

//   // Calculate metrics
//   const handleCalculateMetrics = async () => {
//     if (competitors.length === 0) {
//       setError("Add competitors first to calculate metrics");
//       return;
//     }

//     setIsCalculatingMetrics(true);
//     setError(null);

//     try {
//       const competitorIds = competitors.map((c) => c.id);

//       const result = await MetricsAPI.calculate({
//         competitor_ids: competitorIds,
//         time_period: selectedPeriod,
//         force_recalculate: true, // Force recalculation to avoid duplicate key errors
//       });

//       console.log("Metrics calculation result:", result);

//       // Reload metrics data
//       await Promise.all([
//         loadMetricsSummary(),
//         loadMetricsOverview(),
//         loadPlatformStats(),
//       ]);

//       // Show success message
//       setError("Metrics calculated successfully!");
//       setTimeout(() => setError(null), 3000);
//     } catch (error: any) {
//       console.error("Error calculating metrics:", error);
//       setError(`Failed to calculate metrics: ${error.message}`);
//     } finally {
//       setIsCalculatingMetrics(false);
//     }
//   };

//   // Calculate engagement score for trending ads - UPDATED: Uses normalized data
//   const calculateEngagementScore = (ad: TrendingAdType): number => {
//     let score = 0;

//     // Use normalized values from the API
//     const views = typeof ad.views === 'number' ? ad.views : 0;
//     const likes = typeof ad.likes === 'number' ? ad.likes : 0;
//     const comments = typeof ad.comments === 'number' ? ad.comments : 0;
//     const shares = typeof ad.shares === 'number' ? ad.shares : 0;
//     const impressions = typeof ad.impressions === 'number' ? ad.impressions : 0;

//     // Base engagement score (70 points max)
//     const engagement = likes + (comments * 5) + (shares * 3);
//     score += Math.min(Math.pow(engagement, 0.4) * 3, 70);

//     // View bonus (15 points max)
//     if (views > 0) {
//       const viewBonus = Math.min(Math.pow(views, 0.3), 15);
//       score += viewBonus;
//     } else if (impressions > 0) {
//       const impressionBonus = Math.min(Math.pow(impressions, 0.3), 15);
//       score += impressionBonus;
//     }

//     // Recency bonus (15 points max)
//     if (ad.created_at || ad.published_at || ad.taken_at) {
//       const dateStr = ad.created_at || ad.published_at || ad.taken_at || '';
//       try {
//         const postDate = new Date(dateStr);
//         const now = new Date();
//         const hoursDiff = Math.abs(now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
        
//         if (hoursDiff < 1) score += 15;
//         else if (hoursDiff < 24) score += 10;
//         else if (hoursDiff < 168) score += 5; // 7 days
//         else if (hoursDiff < 720) score += 2; // 30 days
//       } catch {
//         // Date parsing failed, skip recency bonus
//       }
//     }

//     // Platform bonus (10 points max)
//     const platform = ad.platform?.toLowerCase() || '';
//     const platformBonuses: Record<string, number> = {
//       'tiktok': 10,
//       'instagram': 8,
//       'reddit': 6,
//       'youtube': 5,
//       'meta': 3,
//       'facebook': 3,
//       'linkedin': 4,
//     };
    
//     score += platformBonuses[platform] || 0;
    
//     // Video content bonus
//     if (ad.video_url || ad.type?.toLowerCase().includes('video')) {
//       score += 3;
//     }

//     // Quality bonus (10 points max)
//     let qualityScore = 0;
//     if (ad.title && ad.title.length > 10) qualityScore += 2;
//     if (ad.description && ad.description.length > 20) qualityScore += 3;
//     if (ad.image_url || ad.thumbnail) qualityScore += 2;
//     if (ad.video_url) qualityScore += 3;
//     if (ad.channel || ad.owner || ad.advertiser) qualityScore += 2;
    
//     score += Math.min(qualityScore, 10);

//     // Add score from API if available
//     if (ad.score) {
//       score += Math.min(ad.score, 30);
//     }

//     return Math.min(Math.round(score), 100); // Cap at 100
//   };

//   // Filter ads based on search, platform, and company
//   useEffect(() => {
//     let filtered = [...ads];

//     // Filter by search query
//     if (searchQuery) {
//       filtered = filtered.filter(
//         (ad) =>
//           ad?.competitor_name
//             ?.toLowerCase()
//             .includes(searchQuery.toLowerCase()) ||
//           ad?.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           ad?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           ad?.full_text?.toLowerCase().includes(searchQuery.toLowerCase()),
//       );
//     }

//     // Filter by platform
//     if (selectedPlatform !== "all") {
//       filtered = filtered.filter(
//         (ad) => ad?.platform?.toLowerCase() === selectedPlatform.toLowerCase(),
//       );
//     }

//     // Filter by company
//     if (selectedCompany !== "all") {
//       filtered = filtered.filter((ad) => ad?.competitor_id === selectedCompany);
//     }

//     setFilteredAds(filtered);
//   }, [ads, searchQuery, selectedPlatform, selectedCompany]);

//   // Add competitor handler
//   const handleAddCompetitor = async () => {
//     if (!newCompetitor.name.trim()) {
//       setError("Competitor name is required");
//       return;
//     }

//     try {
//       await CompetitorsAPI.create(newCompetitor);
//       await loadCompetitors();
//       setNewCompetitor({
//         name: "",
//         domain: "",
//         industry: "",
//         estimated_monthly_spend: 0,
//       });
//       setShowAddCompetitor(false);
//       setError(null);
//     } catch (error: any) {
//       console.error("Error adding competitor:", error);
//       setError(error.message || "Failed to add competitor");
//     }
//   };

//   // Refresh ads handler
//   const handleRefreshAds = async () => {
//     setIsRefreshing(true);
//     setError(null);
//     try {
//       if (selectedCompetitor) {
//         await AdsAPI.refreshCompetitor(selectedCompetitor);
//       } else {
//         await AdsAPI.refreshAll();
//       }

//       // Reload data after refresh
//       await Promise.all([
//         loadRecentAds(selectedCompetitor || undefined),
//         loadSummaryMetrics(),
//         loadPlatformStats(),
//         loadTrendingAds(),
//         loadMetricsSummary(),
//         loadMetricsOverview(),
//       ]);
//     } catch (error: any) {
//       console.error("Error refreshing ads:", error);
//       setError(error.message || "Failed to refresh ads");
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   // Toggle section expansion
//   const toggleSection = (section: string) => {
//     setExpandedSections((prev) => ({
//       ...prev,
//       [section]: !prev[section],
//     }));
//   };

//   // Formatting helpers
//   const formatCurrency = (amount: number | string | undefined) => {
//     if (amount === undefined || amount === null) return "$0";

//     let numAmount: number;
//     if (typeof amount === "string") {
//       numAmount = parseSpendValue(amount);
//     } else {
//       numAmount = amount;
//     }

//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "USD",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(numAmount);
//   };

//   const formatCurrencyShort = (amount: number | string | undefined) => {
//     if (amount === undefined || amount === null) return "$0";

//     let numAmount: number;
//     if (typeof amount === "string") {
//       numAmount = parseSpendValue(amount);
//     } else {
//       numAmount = amount;
//     }

//     if (numAmount >= 1000000) return `$${(numAmount / 1000000).toFixed(1)}M`;
//     if (numAmount >= 1000) return `$${(numAmount / 1000).toFixed(1)}K`;
//     return `$${Math.round(numAmount)}`;
//   };

//   const formatNumber = (num: number | undefined) => {
//     if (num === undefined || num === null || isNaN(num)) return "0";
//     if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
//     if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
//     return Math.round(num).toString();
//   };

//   const formatPercentage = (value: number | string | undefined) => {
//     if (value === undefined || value === null) return "0.00%";

//     let numValue: number;
//     if (typeof value === "string") {
//       numValue = parseFloat(value);
//       if (isNaN(numValue)) return "0.00%";
//     } else {
//       numValue = value;
//     }

//     return `${(numValue * 100).toFixed(2)}%`;
//   };

//   const formatDecimal = (
//     value: number | string | undefined,
//     decimals: number = 2,
//   ) => {
//     if (value === undefined || value === null) return "0.00";

//     let numValue: number;
//     if (typeof value === "string") {
//       numValue = parseFloat(value);
//       if (isNaN(numValue)) return "0.00";
//     } else {
//       numValue = value;
//     }

//     return numValue.toFixed(decimals);
//   };

//   const formatDate = (dateString: string | undefined) => {
//     if (!dateString) return "N/A";
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) return "Invalid date";
//       const now = new Date();
//       const diffMs = now.getTime() - date.getTime();
//       const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

//       if (diffDays === 0) return "Today";
//       if (diffDays === 1) return "Yesterday";
//       if (diffDays < 7) return `${diffDays} days ago`;

//       return date.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//         year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
//       });
//     } catch {
//       return "N/A";
//     }
//   };

//   const getStatusColor = (status: string | undefined) => {
//     if (!status) return "bg-gray-500";
//     switch (status.toLowerCase()) {
//       case "active":
//         return "bg-green-500";
//       case "pending":
//         return "bg-yellow-500";
//       case "paused":
//         return "bg-orange-500";
//       case "ended":
//         return "bg-gray-500";
//       default:
//         return "bg-blue-500";
//     }
//   };

//   const proxyImageUrl = (url: string | undefined): string => {
//     if (!url) return 'https://via.placeholder.com/300x200?text=No+Image';
    
//     // Skip proxy for placeholder images
//     if (url.includes('via.placeholder.com')) return url;
    
//     // Use a public CORS proxy
//     const proxyUrl = 'https://corsproxy.io/?';
//     return proxyUrl + encodeURIComponent(url);
//   };

//   const getStatusBadge = (status: boolean | undefined) => {
//     if (status === undefined)
//       return "bg-gray-100 text-gray-800 border-gray-200";
//     return status
//       ? "bg-green-100 text-green-800 border-green-200"
//       : "bg-gray-100 text-gray-800 border-gray-200";
//   };

//   const getScoreColor = (score: number) => {
//     if (score >= 80) return "text-green-600 bg-green-50";
//     if (score >= 60) return "text-yellow-600 bg-yellow-50";
//     if (score >= 40) return "text-orange-600 bg-orange-50";
//     return "text-red-600 bg-red-50";
//   };

//   // Render JSON data as formatted list
//   const renderJSONData = (data: any, title: string) => {
//     if (!data || Object.keys(data).length === 0) {
//       return (
//         <div className="text-gray-500 text-sm italic">
//           No {title} data available
//         </div>
//       );
//     }

//     if (Array.isArray(data)) {
//       return (
//         <div className="space-y-2">
//           {data.map((item, index) => (
//             <div key={index} className="text-sm text-gray-700">
//               {JSON.stringify(item, null, 2)}
//             </div>
//           ))}
//         </div>
//       );
//     }

//     return (
//       <div className="space-y-1">
//         {Object.entries(data).map(([key, value]) => (
//           <div key={key} className="flex justify-between items-center">
//             <span className="text-sm text-gray-600">{key}:</span>
//             <span className="text-sm font-medium text-gray-900">
//               {typeof value === "number" ? formatNumber(value) : String(value)}
//             </span>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   // Render platform distribution chart
//   const renderPlatformDistribution = (data: Record<string, number>) => {
//     if (!data || Object.keys(data).length === 0) {
//       return (
//         <div className="text-gray-500 text-sm italic">No platform data</div>
//       );
//     }

//     const chartData = Object.entries(data).map(([platform, count]) => ({
//       platform,
//       count,
//     }));

//     return (
//       <div className="h-48">
//         <ResponsiveContainer width="100%" height="100%">
//           <RechartsPieChart>
//             <Pie
//               data={chartData}
//               cx="50%"
//               cy="50%"
//               innerRadius={40}
//               outerRadius={70}
//               paddingAngle={5}
//               dataKey="count"
//               nameKey="platform"
//               label={({ platform, count }) => `${platform}: ${count}`}
//             >
//               {chartData.map((entry, index) => (
//                 <Cell
//                   key={`cell-${index}`}
//                   fill={
//                     [
//                       "#00C2B3",
//                       "#4A90E2",
//                       "#FF6B6B",
//                       "#FFD166",
//                       "#9B59B6",
//                       "#2ECC71",
//                     ][index % 6]
//                   }
//                 />
//               ))}
//             </Pie>
//             <Tooltip />
//             <Legend />
//           </RechartsPieChart>
//         </ResponsiveContainer>
//       </div>
//     );
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
//           <p className="mt-4 text-gray-600">
//             Loading surveillance dashboard...
//           </p>
//           <p className="text-sm text-gray-500 mt-2">
//             Preparing your competitive intelligence
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
//       {/* Error Alert */}
//       {error && (
//         <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
//           <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
//           <div className="flex-1">
//             <p className="text-red-700 text-sm">{error}</p>
//             <button
//               onClick={() => setError(null)}
//               className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
//             >
//               Dismiss
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
//           <div>
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
//                 <Shield className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
//                   AdSurv Intelligence
//                 </h1>
//                 <p className="text-gray-600">
//                   Real-time competitor advertising surveillance
//                 </p>
//               </div>
//             </div>

//             {/* User Info */}
//             {userInfo && (
//               <div className="flex items-center gap-2 mt-3 bg-white/50 backdrop-blur-sm rounded-lg p-2 inline-flex">
//                 <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
//                   {userInfo.name?.charAt(0) || "U"}
//                 </div>
//                 <div>
//                   <div className="text-sm font-medium text-gray-900">
//                     {userInfo.name || "User"}
//                   </div>
//                   <div className="text-xs text-gray-500">
//                     {userInfo.email || ""}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Header Actions */}
//           <div className="flex flex-wrap items-center gap-3">
//             {/* Connection Status */}
//             <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
//               <div
//                 className={`w-2 h-2 rounded-full ${isAuthenticated ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
//               ></div>
//               <span className="text-sm font-medium text-gray-700">
//                 {isAuthenticated ? "Connected" : "Not Connected"}
//               </span>
//             </div>

//             {/* Calculate Metrics Button */}
//             <button
//               onClick={handleCalculateMetrics}
//               disabled={isCalculatingMetrics || competitors.length === 0}
//               className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               <BarChart2 className="w-4 h-4" />
//               <span>
//                 {isCalculatingMetrics ? "Calculating..." : "Calculate Metrics"}
//               </span>
//             </button>

//             {/* Add Competitor Button */}
//             <button
//               onClick={() => setShowAddCompetitor(true)}
//               className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
//             >
//               <Plus className="w-4 h-4" />
//               <span>Add Competitor</span>
//             </button>

//             {/* Refresh Button */}
//             <button
//               onClick={handleRefreshAds}
//               disabled={isRefreshing}
//               className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
//             >
//               <RefreshCw
//                 className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
//               />
//               <span>Refresh</span>
//             </button>

//             {/* Trending Search Button */}
//             <button
//               onClick={() => setShowTrendingSearch(true)}
//               className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
//             >
//               <TrendingUp className="w-4 h-4" />
//               <span>Trending Search</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Trending Search Modal */}
//       {showTrendingSearch && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Search Trending Content
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Real-time search across social media platforms
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => {
//                     setShowTrendingSearch(false);
//                     setError(null);
//                   }}
//                   className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <div className="space-y-6">
//                 {/* Search Keyword */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Search Keyword *
//                   </label>
//                   <div className="flex gap-2">
//                     <input
//                       type="text"
//                       value={trendingSearchKeyword}
//                       onChange={(e) => setTrendingSearchKeyword(e.target.value)}
//                       placeholder="e.g., fitness shoes, technology, nike"
//                       className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                     />
//                     <button
//                       onClick={handleTrendingSearch}
//                       disabled={isSearchingTrending || !trendingSearchKeyword.trim()}
//                       className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
//                     >
//                       {isSearchingTrending ? (
//                         <>
//                           <Loader2 className="w-4 h-4 animate-spin" />
//                           <span>Searching...</span>
//                         </>
//                       ) : (
//                         <>
//                           <Search className="w-4 h-4" />
//                           <span>Search</span>
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 </div>

//                 {/* Platform Selection */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Select Platforms *
//                   </label>
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                     {['meta', 'instagram', 'youtube', 'reddit', 'linkedin', 'tiktok'].map((platform) => (
//                       <button
//                         key={platform}
//                         onClick={() => toggleTrendingPlatform(platform)}
//                         className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
//                           selectedTrendingPlatforms.includes(platform)
//                             ? 'border-orange-500 bg-orange-50'
//                             : 'border-gray-200 hover:border-gray-300'
//                         }`}
//                       >
//                         <div className={`p-2 rounded-full ${
//                           selectedTrendingPlatforms.includes(platform)
//                             ? 'bg-orange-100 text-orange-600'
//                             : 'bg-gray-100 text-gray-500'
//                         }`}>
//                           {platformIcons[platform] || <Globe className="w-5 h-5" />}
//                         </div>
//                         <span className="text-sm font-medium capitalize">
//                           {platform === 'meta' ? 'Facebook' : platform}
//                         </span>
//                         <span className="text-xs text-gray-500">
//                           {selectedTrendingPlatforms.includes(platform) ? 'Selected' : 'Click to select'}
//                         </span>
//                       </button>
//                     ))}
//                   </div>
//                   <p className="text-xs text-gray-500 mt-2">
//                     Select 1-3 platforms for best results. More platforms = more API calls.
//                   </p>
//                 </div>

//                 {/* How It Works */}
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <h4 className="font-medium text-gray-900 mb-2">How Trending Search Works</h4>
//                   <div className="space-y-2 text-sm text-gray-600">
//                     <div className="flex items-start gap-2">
//                       <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs mt-0.5 flex-shrink-0">
//                         1
//                       </div>
//                       <span>Real-time API calls to platform APIs (Facebook Ad Library, YouTube, Instagram, etc.)</span>
//                     </div>
//                     <div className="flex items-start gap-2">
//                       <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs mt-0.5 flex-shrink-0">
//                         2
//                       </div>
//                       <span>Parallel search across selected platforms (all at once, not sequential)</span>
//                     </div>
//                     <div className="flex items-start gap-2">
//                       <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs mt-0.5 flex-shrink-0">
//                         3
//                       </div>
//                       <span>Smart scoring algorithm (engagement, recency, platform quality)</span>
//                     </div>
//                     <div className="flex items-start gap-2">
//                       <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs mt-0.5 flex-shrink-0">
//                         4
//                       </div>
//                       <span>Cross-platform ranking to show top-performing content across all platforms</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-8 flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setShowTrendingSearch(false);
//                     setError(null);
//                   }}
//                   className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleTrendingSearch}
//                   disabled={isSearchingTrending || !trendingSearchKeyword.trim() || selectedTrendingPlatforms.length === 0}
//                   className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isSearchingTrending ? (
//                     <span className="flex items-center gap-2">
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Searching...
//                     </span>
//                   ) : (
//                     'Search Trending Content'
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add Competitor Modal */}
//       {showAddCompetitor && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Add New Competitor
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Track their advertising activities
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => {
//                     setShowAddCompetitor(false);
//                     setError(null);
//                   }}
//                   className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Competitor Name *
//                   </label>
//                   <input
//                     type="text"
//                     value={newCompetitor.name}
//                     onChange={(e) =>
//                       setNewCompetitor({
//                         ...newCompetitor,
//                         name: e.target.value,
//                       })
//                     }
//                     className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//                     placeholder="e.g., Nike Running"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Website Domain
//                   </label>
//                   <input
//                     type="text"
//                     value={newCompetitor.domain}
//                     onChange={(e) =>
//                       setNewCompetitor({
//                         ...newCompetitor,
//                         domain: e.target.value,
//                       })
//                     }
//                     className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//                     placeholder="e.g., nike.com"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Industry
//                   </label>
//                   <input
//                     type="text"
//                     value={newCompetitor.industry}
//                     onChange={(e) =>
//                       setNewCompetitor({
//                         ...newCompetitor,
//                         industry: e.target.value,
//                       })
//                     }
//                     className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//                     placeholder="e.g., Sportswear, E-commerce"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Estimated Monthly Ad Spend ($)
//                   </label>
//                   <input
//                     type="number"
//                     value={newCompetitor.estimated_monthly_spend || ""}
//                     onChange={(e) =>
//                       setNewCompetitor({
//                         ...newCompetitor,
//                         estimated_monthly_spend: e.target.value
//                           ? parseInt(e.target.value)
//                           : 0,
//                       })
//                     }
//                     className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//                     placeholder="e.g., 50000"
//                   />
//                 </div>
//               </div>

//               <div className="mt-8 flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setShowAddCompetitor(false);
//                     setError(null);
//                   }}
//                   className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleAddCompetitor}
//                   disabled={!newCompetitor.name.trim()}
//                   className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   Add Competitor
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Main Dashboard Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
//         {/* Summary Metrics */}
//         <div className="lg:col-span-2">
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {/* Total Spend */}
//             <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="p-2 bg-blue-50 rounded-lg">
//                   <DollarSign className="w-5 h-5 text-blue-600" />
//                 </div>
//                 <div className="text-xs text-gray-500">Monthly</div>
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900">
//                 {summaryMetrics
//                   ? formatCurrencyShort(summaryMetrics.total_competitor_spend)
//                   : "$0"}
//               </h3>
//               <p className="text-gray-600 text-sm">Total Competitor Spend</p>
//               <div className="mt-3 pt-3 border-t border-gray-100">
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="text-gray-500">
//                     Across {competitors.length} competitors
//                   </span>
//                   <button
//                     onClick={() => setActiveChart("financial")}
//                     className="text-blue-600 hover:text-blue-800 font-medium"
//                   >
//                     View details →
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Active Campaigns */}
//             <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="p-2 bg-green-50 rounded-lg">
//                   <Target className="w-5 h-5 text-green-600" />
//                 </div>
//                 <div className="text-xs text-gray-500">Live</div>
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900">
//                 {summaryMetrics
//                   ? formatNumber(summaryMetrics.active_campaigns)
//                   : "0"}
//               </h3>
//               <p className="text-gray-600 text-sm">Active Campaigns</p>
//               <div className="mt-3 pt-3 border-t border-gray-100">
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="text-gray-500">Live monitoring</span>
//                   <button
//                     onClick={() => loadRecentAds()}
//                     className="text-blue-600 hover:text-blue-800 font-medium"
//                   >
//                     Track →
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Total Impressions */}
//             <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="p-2 bg-purple-50 rounded-lg">
//                   <Eye className="w-5 h-5 text-purple-600" />
//                 </div>
//                 <div className="text-xs text-gray-500">Reach</div>
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900">
//                 {summaryMetrics
//                   ? formatNumber(summaryMetrics.total_impressions)
//                   : "0"}
//               </h3>
//               <p className="text-gray-600 text-sm">Total Impressions</p>
//               <div className="mt-3 pt-3 border-t border-gray-100">
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="text-gray-500">Combined reach</span>
//                   <button
//                     onClick={() => setActiveChart("trends")}
//                     className="text-blue-600 hover:text-blue-800 font-medium"
//                   >
//                     Analyze →
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Average CTR */}
//             <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="p-2 bg-orange-50 rounded-lg">
//                   <MousePointer className="w-5 h-5 text-orange-600" />
//                 </div>
//                 <div className="text-xs text-gray-500">Avg.</div>
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900">
//                 {summaryMetrics
//                   ? formatPercentage(summaryMetrics.avg_ctr)
//                   : "0%"}
//               </h3>
//               <p className="text-gray-600 text-sm">Avg. CTR</p>
//               <div className="mt-3 pt-3 border-t border-gray-100">
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="text-gray-500">Industry benchmark</span>
//                   <button
//                     onClick={() => setActiveChart("performance")}
//                     className="text-blue-600 hover:text-blue-800 font-medium"
//                   >
//                     Compare →
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Platform Distribution */}
//         <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="font-semibold text-gray-900">
//               Platform Distribution
//             </h3>
//             <Globe className="w-5 h-5 text-gray-400" />
//           </div>

//           {platformStats.length > 0 ? (
//             <div className="space-y-4">
//               {platformStats.map((platform, index) => (
//                 <div
//                   key={`${platform.platform}-${index}`}
//                   className="space-y-2"
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <div
//                         className="w-3 h-3 rounded-full"
//                         style={{ backgroundColor: platform.color }}
//                       />
//                       <span className="text-sm font-medium text-gray-700">
//                         {platform.platform}
//                       </span>
//                     </div>
//                     <span className="text-sm font-semibold text-gray-900">
//                       {formatCurrencyShort(platform.total_spend)}
//                     </span>
//                   </div>
//                   <div className="w-full bg-gray-100 rounded-full h-2">
//                     <div
//                       className="h-2 rounded-full transition-all duration-500"
//                       style={{
//                         width: `${Math.min(platform.percentage || 0, 100)}%`,
//                         backgroundColor: platform.color,
//                       }}
//                     />
//                   </div>
//                   <div className="flex items-center justify-between text-xs text-gray-500">
//                     <span>{formatNumber(platform.ad_count)} ads</span>
//                     <span>{formatPercentage(platform.avg_ctr)} CTR</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="py-8 text-center">
//               <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
//               <p className="text-gray-500 text-sm">
//                 No platform data available
//               </p>
//               <button
//                 onClick={handleCalculateMetrics}
//                 className="mt-3 text-sm text-blue-600 hover:text-blue-800"
//               >
//                 Calculate metrics →
//               </button>
//             </div>
//           )}

//           {platformStats.length > 0 && (
//             <div className="mt-6 pt-4 border-t border-gray-100">
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-gray-600">Total across platforms</span>
//                 <span className="font-semibold text-gray-900">
//                   {formatCurrencyShort(
//                     platformStats.reduce(
//                       (sum, p) => sum + (p.total_spend || 0),
//                       0,
//                     ),
//                   )}
//                 </span>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Metrics Overview Section */}
//       {metricsOverview && (
//         <div className="mb-6">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//             <div className="px-5 py-4 border-b border-gray-200">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
//                     <BarChart2 className="w-5 h-5 text-white" />
//                   </div>
//                   <div>
//                     <h3 className="font-semibold text-gray-900">
//                       Metrics Overview
//                     </h3>
//                     <p className="text-sm text-gray-600">
//                       Key performance indicators across all competitors
//                     </p>
//                   </div>
//                 </div>
//                 <select
//                   value={selectedPeriod}
//                   onChange={(e) => setSelectedPeriod(e.target.value as any)}
//                   className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   <option value="daily">Daily</option>
//                   <option value="weekly">Weekly</option>
//                   <option value="monthly">Monthly</option>
//                   <option value="all_time">All Time</option>
//                 </select>
//               </div>
//             </div>

//             <div className="p-5">
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                 {/* Total Competitors */}
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="flex items-center gap-2 mb-2">
//                     <Users className="w-4 h-4 text-gray-500" />
//                     <span className="text-sm text-gray-600">
//                       Total Competitors
//                     </span>
//                   </div>
//                   <div className="text-2xl font-bold text-gray-900">
//                     {metricsOverview.totalCompetitors}
//                   </div>
//                 </div>

//                 {/* Total Ads Tracked */}
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="flex items-center gap-2 mb-2">
//                     <Target className="w-4 h-4 text-gray-500" />
//                     <span className="text-sm text-gray-600">
//                       Total Ads Tracked
//                     </span>
//                   </div>
//                   <div className="text-2xl font-bold text-gray-900">
//                     {formatNumber(metricsOverview.totalAdsTracked)}
//                   </div>
//                 </div>

//                 {/* Total Spend */}
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="flex items-center gap-2 mb-2">
//                     <DollarSign className="w-4 h-4 text-gray-500" />
//                     <span className="text-sm text-gray-600">Total Spend</span>
//                   </div>
//                   <div className="text-2xl font-bold text-gray-900">
//                     {formatCurrencyShort(metricsOverview.totalSpend)}
//                   </div>
//                 </div>

//                 {/* Average CTR */}
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="flex items-center gap-2 mb-2">
//                     <MousePointer className="w-4 h-4 text-gray-500" />
//                     <span className="text-sm text-gray-600">Average CTR</span>
//                   </div>
//                   <div className="text-2xl font-bold text-gray-900">
//                     {formatPercentage(metricsOverview.avgCtr)}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Trending Ads Section */}
//       <div className="mb-6">
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <div className="px-5 py-4 border-b border-gray-200">
//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
//                   <TrendingUp className="w-5 h-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-gray-900">
//                     Trending Ads & Content
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Real-time trending content across social platforms
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2">
//                 {trendingSearchResult && (
//                   <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
//                     "{trendingSearchResult.keyword}"
//                   </span>
//                 )}
//                 <button
//                   onClick={() => setShowTrendingSearch(true)}
//                   className="text-xs px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded hover:opacity-90"
//                 >
//                   New Search
//                 </button>
//               </div>
//             </div>
//           </div>

//           {isLoadingTrending ? (
//             <div className="p-8 text-center">
//               <div className="w-8 h-8 border-2 border-t-orange-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
//               <p className="mt-3 text-gray-600">Searching trending content...</p>
//               <p className="text-xs text-gray-500 mt-1">
//                 Making parallel API calls to {selectedTrendingPlatforms.length} platforms
//               </p>
//             </div>
//           ) : trendingAds.length > 0 ? (
//             <div>
//               <div className="p-5">
//                 {/* Platform Performance Summary */}
//                 {trendingSearchResult?.platform_performance && (
//                   <div className="mb-6 p-4 bg-gray-50 rounded-lg">
//                     <h4 className="font-medium text-gray-900 mb-3">Platform Performance</h4>
//                     <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
//                       {Object.entries(trendingSearchResult.platform_performance).map(([platform, avgScore]) => (
//                         <div key={platform} className="bg-white p-3 rounded border border-gray-200">
//                           <div className="flex items-center gap-2 mb-1">
//                             <div className="p-1.5 bg-gray-100 rounded">
//                               {platformIcons[platform] || <Globe className="w-3 h-3" />}
//                             </div>
//                             <span className="text-sm font-medium capitalize">
//                               {platform === 'meta' ? 'Facebook' : platform}
//                             </span>
//                           </div>
//                           <div className="flex items-center justify-between">
//                             <span className="text-xs text-gray-600">Avg Score:</span>
//                             <span className="text-sm font-semibold text-gray-900">
//                               {avgScore.toFixed(1)}
//                             </span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Trending Ads Grid */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//                   {trendingAds.map((ad, index) => (
//                     <div
//                       key={ad.id || `${ad.platform}-${index}`}
//                       className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow border border-gray-200"
//                     >
//                       {/* Image/Video Preview */}
//                       <div className="aspect-video bg-gray-200 relative overflow-hidden">
//                         {ad.image_url || ad.thumbnail ? (
//                           <img
//                             src={proxyImageUrl(ad.image_url) || ad.thumbnail}
//                             alt={ad.title}
//                             className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
//                             onError={(e) => {
//                               (e.target as HTMLImageElement).src =
//                                 "https://via.placeholder.com/300x200?text=No+Image";
//                             }}
//                           />
//                         ) : (
//                           <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
//                             <div className="text-center">
//                               {ad.video_url ? (
//                                 <PlayCircle className="w-12 h-12 text-gray-500" />
//                               ) : (
//                                 <ImageIcon className="w-12 h-12 text-gray-500" />
//                               )}
//                             </div>
//                           </div>
//                         )}
//                         <div className="absolute top-2 left-2">
//                           <span className="px-2 py-1 bg-black/70 text-white text-xs rounded flex items-center gap-1">
//                             {platformIcons[ad.platform] || <Globe className="w-3 h-3" />}
//                             <span className="capitalize">{ad.platform === 'meta' ? 'Facebook' : ad.platform}</span>
//                           </span>
//                         </div>
//                         <div className="absolute top-2 right-2">
//                           <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded font-bold">
//                             #{ad.rank || index + 1}
//                           </span>
//                         </div>
//                         <div className="absolute bottom-2 left-2">
//                           <span className="px-2 py-1 bg-black/70 text-white text-xs rounded">
//                             Score: {ad.score?.toFixed(1) || 'N/A'}
//                           </span>
//                         </div>
//                       </div>

//                       {/* Content */}
//                       <div className="p-3">
//                         <div className="flex items-center justify-between mb-2">
//                           <span className="text-xs font-medium text-gray-900 truncate">
//                             {ad.competitor_name || ad.advertiser || ad.channel || ad.owner || 'Unknown Source'}
//                           </span>
//                           <div className="flex items-center">
//                             <div
//                               className={`w-2 h-2 rounded-full mr-1 ${
//                                 ad.engagement_score >= 80
//                                   ? "bg-green-500"
//                                   : ad.engagement_score >= 60
//                                     ? "bg-yellow-500"
//                                     : ad.engagement_score >= 40
//                                       ? "bg-orange-500"
//                                       : "bg-red-500"
//                               }`}
//                             ></div>
//                             <span className="text-xs text-gray-500">
//                               {ad.engagement_score}%
//                             </span>
//                           </div>
//                         </div>

//                         <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
//                           {ad.title || ad.headline || 'No title'}
//                         </h4>

//                         <p className="text-xs text-gray-600 line-clamp-2 mb-3">
//                           {ad.description || 'No description'}
//                         </p>

//                         {/* Engagement Metrics */}
//                         <div className="flex items-center justify-between mb-3">
//                           <div className="flex items-center gap-3">
//                             <div className="flex items-center gap-1">
//                               <Eye className="w-3 h-3 text-gray-400" />
//                               <span className="text-xs text-gray-600">
//                                 {formatNumber(ad.views || ad.impressions)}
//                               </span>
//                             </div>
//                             <div className="flex items-center gap-1">
//                               <Heart className="w-3 h-3 text-red-400" />
//                               <span className="text-xs text-gray-600">
//                                 {formatNumber(ad.likes)}
//                               </span>
//                             </div>
//                             <div className="flex items-center gap-1">
//                               <MessageCircle className="w-3 h-3 text-blue-400" />
//                               <span className="text-xs text-gray-600">
//                                 {formatNumber(ad.comments)}
//                               </span>
//                             </div>
//                           </div>
//                           {ad.spend && typeof ad.spend === 'number' && ad.spend > 0 && (
//                             <span className="text-xs font-medium text-green-600">
//                               {formatCurrencyShort(ad.spend)}
//                             </span>
//                           )}
//                         </div>

//                         {/* Actions */}
//                         <div className="flex items-center justify-between text-xs">
//                           <span className="text-gray-500">
//                             {formatDate(ad.created_at || ad.published_at || ad.taken_at)}
//                           </span>
//                           {ad.url && ad.url !== "#" && (
//                             <a
//                               href={ad.url}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-blue-600 hover:text-blue-800 flex items-center"
//                             >
//                               <LinkIcon className="w-3 h-3 mr-1" />
//                               View
//                             </a>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Trending Search Details */}
//               {trendingSearchResult && (
//                 <div className="px-5 pb-5 border-t border-gray-200 pt-5">
//                   <div className="flex items-center justify-between mb-4">
//                     <h4 className="font-medium text-gray-900">
//                       Search Details
//                     </h4>
//                     <span className="text-xs text-gray-500">
//                       {formatDate(new Date().toISOString())}
//                     </span>
//                   </div>
//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                     <div className="bg-gray-50 p-3 rounded-lg">
//                       <div className="text-xs text-gray-500 mb-1">Keyword</div>
//                       <div className="font-medium text-gray-900">
//                         "{trendingSearchResult.keyword}"
//                       </div>
//                     </div>
//                     <div className="bg-gray-50 p-3 rounded-lg">
//                       <div className="text-xs text-gray-500 mb-1">
//                         Platforms Searched
//                       </div>
//                       <div className="font-medium text-gray-900">
//                         {trendingSearchResult.summary?.platforms_searched?.join(
//                           ", ",
//                         ) || "N/A"}
//                       </div>
//                     </div>
//                     <div className="bg-gray-50 p-3 rounded-lg">
//                       <div className="text-xs text-gray-500 mb-1">
//                         Total Results
//                       </div>
//                       <div className="font-medium text-gray-900">
//                         {formatNumber(
//                           trendingSearchResult.summary?.total_results,
//                         )}
//                       </div>
//                     </div>
//                     <div className="bg-gray-50 p-3 rounded-lg">
//                       <div className="text-xs text-gray-500 mb-1">
//                         Top Score
//                       </div>
//                       <div className="font-medium text-gray-900">
//                         {trendingSearchResult.summary?.top_score?.toFixed(1) ||
//                           "0"}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="p-8 text-center">
//               <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
//                 <TrendingUp className="w-8 h-8 text-gray-400" />
//               </div>
//               <h4 className="text-lg font-medium text-gray-900 mb-2">
//                 No Trending Content Found
//               </h4>
//               <p className="text-gray-600 mb-6">
//                 Search for trending ads and content across social platforms
//               </p>
//               <button
//                 onClick={() => setShowTrendingSearch(true)}
//                 className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90"
//               >
//                 Search Trending Content
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Analytics Dashboard */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
//         <div className="px-5 py-4 border-b border-gray-200">
//           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//             <div>
//               <h3 className="font-semibold text-gray-900">
//                 Analytics Dashboard
//               </h3>
//               <p className="text-sm text-gray-600">
//                 Competitor performance insights
//               </p>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               {[
//                 {
//                   id: "overview",
//                   label: "Overview",
//                   icon: <BarChart2 className="w-4 h-4" />,
//                 },
//                 {
//                   id: "financial",
//                   label: "Financial",
//                   icon: <DollarSign className="w-4 h-4" />,
//                 },
//                 {
//                   id: "performance",
//                   label: "Performance",
//                   icon: <Target className="w-4 h-4" />,
//                 },
//                 {
//                   id: "audience",
//                   label: "Audience",
//                   icon: <Users className="w-4 h-4" />,
//                 },
//                 {
//                   id: "strategic",
//                   label: "Strategic",
//                   icon: <Lightbulb className="w-4 h-4" />,
//                 },
//               ].map((chart) => (
//                 <button
//                   key={chart.id}
//                   onClick={() => setActiveChart(chart.id)}
//                   className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
//                     activeChart === chart.id
//                       ? "bg-blue-600 text-white"
//                       : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                   }`}
//                 >
//                   {chart.icon}
//                   <span className="text-sm">{chart.label}</span>
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>

//         <div className="p-5">
//           {/* Overview Chart */}
//           {activeChart === "overview" && (
//             <div>
//               {selectedMetrics ? (
//                 <div className="space-y-6">
//                   {/* Metrics Summary */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     <div className="bg-blue-50 p-4 rounded-lg">
//                       <div className="flex items-center gap-2 mb-2">
//                         <DollarSign className="w-4 h-4 text-blue-600" />
//                         <span className="text-sm font-medium text-blue-700">
//                           Estimated Monthly Spend
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-blue-900">
//                         {formatCurrency(
//                           selectedMetrics.estimated_monthly_spend,
//                         )}
//                       </div>
//                     </div>

//                     <div className="bg-green-50 p-4 rounded-lg">
//                       <div className="flex items-center gap-2 mb-2">
//                         <MousePointer className="w-4 h-4 text-green-600" />
//                         <span className="text-sm font-medium text-green-700">
//                           Average CTR
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-green-900">
//                         {formatPercentage(selectedMetrics.avg_ctr)}
//                       </div>
//                     </div>

//                     <div className="bg-purple-50 p-4 rounded-lg">
//                       <div className="flex items-center gap-2 mb-2">
//                         <Activity className="w-4 h-4 text-purple-600" />
//                         <span className="text-sm font-medium text-purple-700">
//                           Active Ads
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-purple-900">
//                         {formatNumber(selectedMetrics.active_ads)}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Risk & Opportunity Scores */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center justify-between mb-4">
//                         <div className="flex items-center gap-2">
//                           <AlertOctagon className="w-5 h-5 text-red-500" />
//                           <h4 className="font-medium text-gray-900">
//                             Risk Score
//                           </h4>
//                         </div>
//                         <span
//                           className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(selectedMetrics.risk_score)}`}
//                         >
//                           {selectedMetrics.risk_score}/100
//                         </span>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-2">
//                         <div
//                           className="h-2 rounded-full transition-all duration-500 bg-red-500"
//                           style={{ width: `${selectedMetrics.risk_score}%` }}
//                         />
//                       </div>
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center justify-between mb-4">
//                         <div className="flex items-center gap-2">
//                           <Award className="w-5 h-5 text-green-500" />
//                           <h4 className="font-medium text-gray-900">
//                             Opportunity Score
//                           </h4>
//                         </div>
//                         <span
//                           className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(selectedMetrics.opportunity_score)}`}
//                         >
//                           {selectedMetrics.opportunity_score}/100
//                         </span>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-2">
//                         <div
//                           className="h-2 rounded-full transition-all duration-500 bg-green-500"
//                           style={{
//                             width: `${selectedMetrics.opportunity_score}%`,
//                           }}
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   {/* Platform Distribution */}
//                   <div className="bg-white border border-gray-200 rounded-lg p-4">
//                     <h4 className="font-medium text-gray-900 mb-4">
//                       Platform Distribution
//                     </h4>
//                     {renderPlatformDistribution(
//                       selectedMetrics.ads_per_platform,
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-12">
//                   <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
//                     <BarChart2 className="w-8 h-8 text-gray-400" />
//                   </div>
//                   <h4 className="text-lg font-medium text-gray-900 mb-2">
//                     No Analytics Data Yet
//                   </h4>
//                   <p className="text-gray-600 mb-6">
//                     Start tracking competitors to see analytics
//                   </p>
//                   <div className="flex gap-3 justify-center">
//                     <button
//                       onClick={handleCalculateMetrics}
//                       className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90"
//                     >
//                       Calculate Metrics
//                     </button>
//                     <button
//                       onClick={() => setShowAddCompetitor(true)}
//                       className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
//                     >
//                       Add Competitor
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Financial Metrics */}
//           {activeChart === "financial" && (
//             <div>
//               {selectedMetrics ? (
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <DollarSign className="w-4 h-4 text-blue-600" />
//                         <span className="text-sm font-medium text-gray-700">
//                           Estimated Daily Spend
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">
//                         {formatCurrency(selectedMetrics.estimated_daily_spend)}
//                       </div>
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <DollarSign className="w-4 h-4 text-green-600" />
//                         <span className="text-sm font-medium text-gray-700">
//                           Estimated Weekly Spend
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">
//                         {formatCurrency(selectedMetrics.estimated_weekly_spend)}
//                       </div>
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <DollarSign className="w-4 h-4 text-purple-600" />
//                         <span className="text-sm font-medium text-gray-700">
//                           Estimated Monthly Spend
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">
//                         {formatCurrency(
//                           selectedMetrics.estimated_monthly_spend,
//                         )}
//                       </div>
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <DollarSign className="w-4 h-4 text-orange-600" />
//                         <span className="text-sm font-medium text-gray-700">
//                           Total Spend
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">
//                         {formatCurrency(selectedMetrics.total_spend)}
//                       </div>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <DollarSign className="w-4 h-4 text-red-600" />
//                         <span className="text-sm font-medium text-gray-700">
//                           Average CPM
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">
//                         {formatCurrency(selectedMetrics.avg_cpm)}
//                       </div>
//                       <p className="text-sm text-gray-500 mt-1">
//                         Cost per 1000 impressions
//                       </p>
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <DollarSign className="w-4 h-4 text-green-600" />
//                         <span className="text-sm font-medium text-gray-700">
//                           Average CPC
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">
//                         {formatCurrency(selectedMetrics.avg_cpc)}
//                       </div>
//                       <p className="text-sm text-gray-500 mt-1">
//                         Cost per click
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-12">
//                   <p className="text-gray-500">
//                     No financial metrics available. Calculate metrics first.
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Performance Metrics */}
//           {activeChart === "performance" && (
//             <div>
//               {selectedMetrics ? (
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <MousePointer className="w-4 h-4 text-blue-600" />
//                         <span className="text-sm font-medium text-gray-700">
//                           Average CTR
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">
//                         {formatPercentage(selectedMetrics.avg_ctr)}
//                       </div>
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <Activity className="w-4 h-4 text-green-600" />
//                         <span className="text-sm font-medium text-gray-700">
//                           Average Frequency
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">
//                         {formatDecimal(selectedMetrics.avg_frequency)}
//                       </div>
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-2">
//                         <Target className="w-4 h-4 text-purple-600" />
//                         <span className="text-sm font-medium text-gray-700">
//                           Conversion Probability
//                         </span>
//                       </div>
//                       <div className="text-2xl font-bold text-gray-900">
//                         {formatPercentage(
//                           selectedMetrics.conversion_probability,
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   <div className="bg-white border border-gray-200 rounded-lg p-4">
//                     <h4 className="font-medium text-gray-900 mb-4">
//                       Creative Performance
//                     </h4>
//                     {renderJSONData(
//                       selectedMetrics.creative_performance,
//                       "creative performance",
//                     )}
//                   </div>

//                   <div className="bg-white border border-gray-200 rounded-lg p-4">
//                     <h4 className="font-medium text-gray-900 mb-4">
//                       Top Performing Creatives
//                     </h4>
//                     {renderJSONData(
//                       selectedMetrics.top_performing_creatives,
//                       "top performing creatives",
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-12">
//                   <p className="text-gray-500">
//                     No performance metrics available. Calculate metrics first.
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Audience Metrics */}
//           {activeChart === "audience" && (
//             <div>
//               {selectedMetrics ? (
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-4">
//                         <Users className="w-5 h-5 text-blue-600" />
//                         <h4 className="font-medium text-gray-900">
//                           Funnel Stage Distribution
//                         </h4>
//                       </div>
//                       {renderJSONData(
//                         selectedMetrics.funnel_stage_distribution,
//                         "funnel stage distribution",
//                       )}
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-4">
//                         <UsersIcon className="w-5 h-5 text-green-600" />
//                         <h4 className="font-medium text-gray-900">
//                           Audience Clusters
//                         </h4>
//                       </div>
//                       {renderJSONData(
//                         selectedMetrics.audience_clusters,
//                         "audience clusters",
//                       )}
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-4">
//                         <GlobeIcon className="w-5 h-5 text-purple-600" />
//                         <h4 className="font-medium text-gray-900">
//                           Geo Penetration
//                         </h4>
//                       </div>
//                       {renderJSONData(
//                         selectedMetrics.geo_penetration,
//                         "geo penetration",
//                       )}
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-4">
//                         <Smartphone className="w-5 h-5 text-orange-600" />
//                         <h4 className="font-medium text-gray-900">
//                           Device Distribution
//                         </h4>
//                       </div>
//                       {renderJSONData(
//                         selectedMetrics.device_distribution,
//                         "device distribution",
//                       )}
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center gap-2 mb-4">
//                         <ClockIcon className="w-5 h-5 text-red-600" />
//                         <h4 className="font-medium text-gray-900">
//                           Time of Day Heatmap
//                         </h4>
//                       </div>
//                       {renderJSONData(
//                         selectedMetrics.time_of_day_heatmap,
//                         "time of day heatmap",
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-12">
//                   <p className="text-gray-500">
//                     No audience metrics available. Calculate metrics first.
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Strategic Metrics */}
//           {activeChart === "strategic" && (
//             <div>
//               {selectedMetrics ? (
//                 <div className="space-y-6">
//                   <div className="bg-white border border-gray-200 rounded-lg p-4">
//                     <h4 className="font-medium text-gray-900 mb-4">
//                       Ad Timeline
//                     </h4>
//                     {renderJSONData(selectedMetrics.ad_timeline, "ad timeline")}
//                   </div>

//                   <div className="bg-white border border-gray-200 rounded-lg p-4">
//                     <h4 className="font-medium text-gray-900 mb-4">Trends</h4>
//                     {renderJSONData(selectedMetrics.trends, "trends")}
//                   </div>

//                   <div className="bg-white border border-gray-200 rounded-lg p-4">
//                     <div className="flex items-center justify-between mb-4">
//                       <h4 className="font-medium text-gray-900">
//                         Recommendations
//                       </h4>
//                       <Lightbulb className="w-5 h-5 text-yellow-500" />
//                     </div>
//                     {selectedMetrics.recommendations &&
//                     selectedMetrics.recommendations.length > 0 ? (
//                       <ul className="space-y-3">
//                         {selectedMetrics.recommendations.map((rec, index) => (
//                           <li key={index} className="flex items-start gap-3">
//                             <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
//                               <span className="text-blue-600 text-xs font-semibold">
//                                 {index + 1}
//                               </span>
//                             </div>
//                             <span className="text-sm text-gray-700">{rec}</span>
//                           </li>
//                         ))}
//                       </ul>
//                     ) : (
//                       <p className="text-gray-500 text-sm">
//                         No recommendations available
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-12">
//                   <p className="text-gray-500">
//                     No strategic metrics available. Calculate metrics first.
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Competitors Metrics Summary */}
//       {metricsSummary.length > 0 && (
//         <div className="mb-6">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//             <div className="px-5 py-4 border-b border-gray-200">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
//                     <TargetIcon2 className="w-5 h-5 text-white" />
//                   </div>
//                   <div>
//                     <h3 className="font-semibold text-gray-900">
//                       Competitors Performance
//                     </h3>
//                     <p className="text-sm text-gray-600">
//                       Ranked by opportunity score
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="p-5">
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="border-b border-gray-200">
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Competitor
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Active Ads
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Monthly Spend
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Avg CTR
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Risk Score
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Opportunity Score
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {metricsSummary.map((summary, index) => (
//                       <tr
//                         key={summary.competitor_id}
//                         className="border-b border-gray-100 hover:bg-gray-50"
//                       >
//                         <td className="py-3 px-4">
//                           <div className="flex items-center gap-3">
//                             <div className="w-8 h-8 bg-gradient-to-r from-gray-800 to-gray-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
//                               {summary.competitor_name?.charAt(0) || "C"}
//                             </div>
//                             <div>
//                               <div className="font-medium text-gray-900">
//                                 {summary.competitor_name}
//                               </div>
//                               <div className="text-xs text-gray-500">
//                                 {formatDate(summary.last_calculated)}
//                               </div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="text-gray-900 font-medium">
//                             {formatNumber(summary.active_ads)}
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="text-gray-900 font-medium">
//                             {formatCurrencyShort(
//                               summary.estimated_monthly_spend,
//                             )}
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="text-gray-900 font-medium">
//                             {formatPercentage(summary.avg_ctr)}
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div
//                             className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getScoreColor(summary.risk_score)}`}
//                           >
//                             {summary.risk_score}
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div
//                             className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getScoreColor(summary.opportunity_score)}`}
//                           >
//                             {summary.opportunity_score}
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Competitors List & Live Ad Feed */}
//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
//         {/* Competitors List */}
//         <div className="lg:col-span-1">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
//             <div className="p-5 border-b border-gray-200">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="font-semibold text-gray-900">
//                   Tracked Competitors
//                 </h3>
//                 <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
//                   {competitors.length} total
//                 </span>
//               </div>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <input
//                   type="text"
//                   placeholder="Search competitors..."
//                   className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//               </div>
//             </div>

//             <div className="p-3">
//               <div className="space-y-2 max-h-[400px] overflow-y-auto">
//                 {competitors.map((competitor) => (
//                   <div
//                     key={competitor.id}
//                     className={`p-3 rounded-lg cursor-pointer transition-colors ${
//                       selectedCompetitor === competitor.id
//                         ? "bg-blue-50 border border-blue-200"
//                         : "hover:bg-gray-50"
//                     }`}
//                     onClick={() => {
//                       setSelectedCompetitor(competitor.id);
//                       setSelectedCompany(competitor.id);
//                       loadRecentAds(competitor.id);
//                     }}
//                   >
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 bg-gradient-to-r from-gray-800 to-gray-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
//                           {competitor.name?.charAt(0) || "C"}
//                         </div>
//                         <div>
//                           <div className="font-medium text-gray-900 text-sm">
//                             {competitor.name}
//                           </div>
//                           <div className="text-xs text-gray-500 truncate">
//                             {competitor.industry || "No industry"}
//                           </div>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-xs font-semibold text-gray-700">
//                           {formatNumber(competitor.ads_count)} ads
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {competitor.last_fetched_at
//                             ? formatDate(competitor.last_fetched_at)
//                             : "Never fetched"}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}

//                 {competitors.length === 0 && (
//                   <div className="text-center py-8">
//                     <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
//                       <Users className="w-6 h-6 text-gray-400" />
//                     </div>
//                     <p className="text-gray-600 text-sm">
//                       No competitors tracked yet
//                     </p>
//                     <button
//                       onClick={() => setShowAddCompetitor(true)}
//                       className="mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline"
//                     >
//                       Add your first competitor →
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Live Ad Feed */}
//         <div className="lg:col-span-3">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
//             <div className="px-5 py-4 border-b border-gray-200">
//               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                 <div className="flex items-center gap-4">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Live Ad Feed
//                   </h3>
//                   <div className="flex items-center gap-2">
//                     <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
//                       {filteredAds.length} ads
//                     </span>
//                     <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
//                       {new Date().toLocaleTimeString([], {
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       })}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-3">
//                   {/* Company Filter */}
//                   <div className="flex items-center gap-2">
//                     <label className="text-sm text-gray-600">Company:</label>
//                     <select
//                       className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       value={selectedCompany}
//                       onChange={(e) => {
//                         setSelectedCompany(e.target.value);
//                         if (e.target.value !== "all") {
//                           setSelectedCompetitor(e.target.value);
//                           loadRecentAds(e.target.value);
//                         } else {
//                           setSelectedCompetitor(null);
//                           loadRecentAds();
//                         }
//                       }}
//                     >
//                       <option value="all">All Companies</option>
//                       {competitors.map((comp) => (
//                         <option key={comp.id} value={comp.id}>
//                           {comp.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Platform Filter */}
//                   <div className="flex items-center gap-2">
//                     <label className="text-sm text-gray-600">Platform:</label>
//                     <select
//                       className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       value={selectedPlatform}
//                       onChange={(e) => setSelectedPlatform(e.target.value)}
//                     >
//                       <option value="all">All Platforms</option>
//                       <option value="google">Google</option>
//                       <option value="meta">Meta</option>
//                       <option value="tiktok">TikTok</option>
//                       <option value="linkedin">LinkedIn</option>
//                       <option value="youtube">YouTube</option>
//                       <option value="instagram">Instagram</option>
//                       <option value="twitter">Twitter</option>
//                       <option value="reddit">Reddit</option>
//                       <option value="pinterest">Pinterest</option>
//                     </select>
//                   </div>

//                   {/* View Toggle */}
//                   <div className="flex bg-gray-100 rounded-lg p-1">
//                     <button
//                       onClick={() => setDataViewMode("latest")}
//                       className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${
//                         dataViewMode === "latest"
//                           ? "bg-blue-600 text-white"
//                           : "text-gray-600 hover:text-gray-900"
//                       }`}
//                     >
//                       <Clock className="w-4 h-4" />
//                       Latest
//                     </button>
//                     <button
//                       onClick={() => setDataViewMode("historical")}
//                       className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${
//                         dataViewMode === "historical"
//                           ? "bg-blue-600 text-white"
//                           : "text-gray-600 hover:text-gray-900"
//                       }`}
//                     >
//                       <Calendar className="w-4 h-4" />
//                       Historical
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Ad List */}
//             <div className="divide-y divide-gray-100">
//               {filteredAds.length > 0 ? (
//                 filteredAds.slice(0, 10).map((ad, index) => (
//                   <div
//                     key={ad.id || index}
//                     className="px-5 py-4 hover:bg-gray-50 transition-colors"
//                   >
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex items-start gap-3">
//                         <div className="w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-600 rounded-lg flex items-center justify-center text-white font-semibold">
//                           {ad.competitor_name?.charAt(0) || "A"}
//                         </div>
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2 flex-wrap mb-1">
//                             <h4 className="font-semibold text-gray-900">
//                               {ad.competitor_name}
//                             </h4>
//                             <span
//                               className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(ad.is_active)}`}
//                             >
//                               {ad.is_active ? "ACTIVE" : "INACTIVE"}
//                             </span>
//                             <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
//                               {ad.platform?.toUpperCase() || "UNKNOWN"}
//                             </span>
//                             <span className="text-xs text-gray-500">
//                               {formatDate(ad.last_seen || ad.created_at)}
//                             </span>
//                           </div>
//                           <h5 className="text-gray-900 font-medium">
//                             {ad.headline || "No Title"}
//                           </h5>
//                         </div>
//                       </div>
//                       <button className="text-gray-400 hover:text-gray-600 p-1">
//                         <MoreVertical className="w-5 h-5" />
//                       </button>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                       {/* Ad Content */}
//                       <div className="md:col-span-2">
//                         <p className="text-gray-600 text-sm mb-3 line-clamp-2">
//                           {ad.description ||
//                             ad.full_text ||
//                             "No description available"}
//                         </p>

//                         {/* Image Preview */}
//                         {ad.image_url && (
//                           <div className="mt-3">
//                             <div className="flex items-center gap-2 mb-2">
//                               <ImageIcon className="w-4 h-4 text-gray-400" />
//                               <span className="text-sm text-gray-600">
//                                 Ad Creative
//                               </span>
//                             </div>
//                             <div className="relative rounded-lg overflow-hidden border border-gray-200 max-w-xs">
//                               <img
//                                 src={proxyImageUrl(ad.image_url)}
//                                 alt={ad.headline}
//                                 className="w-full h-48 object-cover"
//                                 onError={(e) => {
//                                   (e.target as HTMLImageElement).src =
//                                     "https://via.placeholder.com/300x200?text=No+Image";
//                                 }}
//                                 referrerPolicy="no-referrer"
//                               />
//                               <div className="absolute bottom-2 right-2">
//                                 <a
//                                   href={ad.image_url}
//                                   target="_blank"
//                                   rel="noopener noreferrer"
//                                   className="px-2 py-1 bg-black/70 text-white text-xs rounded hover:bg-black"
//                                 >
//                                   View Full
//                                 </a>
//                               </div>
//                             </div>
//                           </div>
//                         )}

//                         {/* Destination URL */}
//                         {ad.destination_url && (
//                           <div className="mt-3 flex items-center gap-2">
//                             <LinkIcon className="w-4 h-4 text-gray-400" />
//                             <a
//                               href={ad.destination_url}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-sm text-blue-600 hover:text-blue-800 truncate"
//                             >
//                               {ad.destination_url}
//                             </a>
//                           </div>
//                         )}
//                       </div>

//                       {/* Metrics Grid */}
//                       <div className="grid grid-cols-2 gap-3">
//                         <div className="bg-gray-50 p-3 rounded-lg">
//                           <div className="text-xs text-gray-500 mb-1">
//                             Spend
//                           </div>
//                           <div className="font-semibold text-gray-900">
//                             {formatCurrency(ad.spend)}
//                           </div>
//                         </div>

//                         <div className="bg-gray-50 p-3 rounded-lg">
//                           <div className="text-xs text-gray-500 mb-1">
//                             Impressions
//                           </div>
//                           <div className="font-semibold text-gray-900">
//                             {formatNumber(
//                               typeof ad.impressions === "number"
//                                 ? ad.impressions
//                                 : parseImpressionValue(ad.impressions),
//                             )}
//                           </div>
//                         </div>

//                         <div className="bg-gray-50 p-3 rounded-lg">
//                           <div className="text-xs text-gray-500 mb-1">
//                             First Seen
//                           </div>
//                           <div className="font-semibold text-gray-900 text-sm">
//                             {formatDate(ad.first_seen)}
//                           </div>
//                         </div>

//                         <div className="bg-gray-50 p-3 rounded-lg">
//                           <div className="text-xs text-gray-500 mb-1">
//                             Last Seen
//                           </div>
//                           <div className="font-semibold text-gray-900 text-sm">
//                             {formatDate(ad.last_seen || ad.created_at)}
//                           </div>
//                         </div>

//                         <div className="bg-gray-50 p-3 rounded-lg col-span-2">
//                           <div className="text-xs text-gray-500 mb-1">
//                             Actions
//                           </div>
//                           <div className="flex gap-2">
//                             <button className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex-1">
//                               Analyze
//                             </button>
//                             <button className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 flex-1">
//                               Clone
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="px-5 py-12 text-center">
//                   <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
//                     <Eye className="w-8 h-8 text-gray-400" />
//                   </div>
//                   <h4 className="text-lg font-medium text-gray-900 mb-2">
//                     No Ads Found
//                   </h4>
//                   <p className="text-gray-600 mb-6">
//                     {searchQuery ||
//                     selectedPlatform !== "all" ||
//                     selectedCompany !== "all"
//                       ? "Try adjusting your search or filter criteria"
//                       : "Start tracking competitors to see their ads"}
//                   </p>
//                   <div className="flex gap-3 justify-center">
//                     <button
//                       onClick={() => {
//                         setSearchQuery("");
//                         setSelectedPlatform("all");
//                         setSelectedCompany("all");
//                         setSelectedCompetitor(null);
//                         loadRecentAds();
//                       }}
//                       className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
//                     >
//                       Clear Filters
//                     </button>
//                     <button
//                       onClick={() => setShowAddCompetitor(true)}
//                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//                     >
//                       Add Competitor
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdSurveillance;