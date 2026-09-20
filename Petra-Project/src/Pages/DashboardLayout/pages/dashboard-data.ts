export type StatCardData = {
  title: string;
  value: string;
  delta: string;
  period: string;
  positive: boolean;
  icon: string;
};

export const BRAND_NAME = "Shopeers";

export const stats: StatCardData[] = [
  { title: "Page Views", value: "16,431", delta: "+15,5%", period: "vs. 14,653 last period", positive: true, icon: "eye" },
  { title: "Visitors", value: "6,225", delta: "+8,4%", period: "vs. 5,732 last period", positive: true, icon: "users" },
  { title: "Click", value: "2,832", delta: "-10,5%", period: "vs. 3,294 last period", positive: false, icon: "mouse" },
  { title: "Orders", value: "1,224", delta: "+4,4%", period: "vs. 1,186 last period", positive: true, icon: "shopping" },
];

export const profitData = [
  { date: "Jan 1", thisMonth: 7200, lastMonth: 5100 },
  { date: "Jan 8", thisMonth: 10300, lastMonth: 6200 },
  { date: "Jan 15", thisMonth: 8900, lastMonth: 7100 },
  { date: "Jan 18", thisMonth: 12324, lastMonth: 5563 },
  { date: "Jan 22", thisMonth: 13700, lastMonth: 8200 },
  { date: "Jan 29", thisMonth: 15100, lastMonth: 9300 },
];

export const customers = [
  { label: "Retailers", value: "2,884", color: "blue" },
  { label: "Distributors", value: "1,432", color: "green" },
  { label: "Wholesalers", value: "562", color: "orange" },
];

export const products = [
  { id: "#83009", name: "Hybrid Active Noise Cancelling Headphones", sold: "2,310", revenue: "$124.839", positive: true, rating: "5.0", icon: "headphones" },
  { id: "#83001", name: "Casio G-Shock Resin Watch", sold: "1,230", revenue: "$92.662", positive: false, rating: "4.8", icon: "watch" },
  { id: "#83004", name: "SAMSUNG Galaxy S25 Ultra", sold: "812", revenue: "$74.048", positive: false, rating: "4.7", icon: "phone" },
  { id: "#83002", name: "Xbox Wireless Gaming Controller", sold: "645", revenue: "$62.820", positive: true, rating: "4.5", icon: "controller" },
  { id: "#83002", name: "Timex Men's Easy Reader Watch", sold: "572", revenue: "$48.724", positive: true, rating: "4.5", icon: "watch" },
];

export const dayActivity = [
  { day: "Sun", value: 5200 },
  { day: "Mon", value: 6100 },
  { day: "Tue", value: 8162 },
  { day: "Wed", value: 5800 },
  { day: "Thu", value: 6700 },
  { day: "Fri", value: 5400 },
  { day: "Sat", value: 4600 },
];

export const widgetItems = [
  { id: "visitors", title: "Visitors by Device", description: "Track how customers access your store across mobile, desktop, and tablet.", tag: "#Audience Insights", preview: "donut" },
  { id: "overview", title: "Dashboard Overview", description: "View key business metrics and performance trends in one place.", tag: "#Performance", preview: "kpi", dragged: true },
  { id: "orders", title: "Orders Performance", description: "Monitor order volume, fulfillment status, and sales activity in real time.", tag: "#Operations", preview: "bars" },
  { id: "trend", title: "Trend Analysis", description: "Group customers by behavior and demographics for targeted marketing.", tag: "#Strategy", preview: "line" },
  { id: "segments", title: "Customer Segmentation", description: "Group customers by behavior and demographics...", tag: "#Strategy", preview: "donut" },
];

export const periods = ["Today", "Last 7 days", "Last 30 days", "Last 90 days", "Custom"];
