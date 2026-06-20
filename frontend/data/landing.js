import {
  BarChart3,
  Receipt,
  PieChart,
  CreditCard,
  Bot,
  RefreshCw,
  UserPlus,
  LineChart,
  Sparkles,
  Shield,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const statsData = [
  { value: "50K+", label: "Active Users" },
  { value: "₹10Cr+", label: "Transactions Tracked" },
  { value: "99.9%", label: "Platform Uptime" },
  { value: "4.8/5", label: "User Rating" },
];

export const featuresData = [
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Visualize income, expenses, and trends with detailed monthly reports and category breakdowns.",
  },
  {
    icon: Receipt,
    title: "Smart Receipt Scanner",
    description:
      "Upload a receipt photo and let AI extract amount, category, and merchant details instantly.",
  },
  {
    icon: PieChart,
    title: "Budget Planning",
    description:
      "Set monthly and category-wise budgets with real-time progress tracking and alerts.",
  },
  {
    icon: CreditCard,
    title: "Multi-Account Support",
    description:
      "Manage current and savings accounts in one dashboard with a unified net worth view.",
  },
  {
    icon: Bot,
    title: "AI Finance Coach",
    description:
      "Ask questions about your spending and receive personalized insights from your actual data.",
  },
  {
    icon: RefreshCw,
    title: "Subscription Tracker",
    description:
      "Automatically detect recurring expenses and monitor your monthly subscription costs.",
  },
];

export const howItWorksData = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create your account",
    description:
      "Sign up with email or Google in under a minute. Your data stays secure and private.",
  },
  {
    icon: LineChart,
    step: "02",
    title: "Track every transaction",
    description:
      "Add expenses manually, scan receipts, or set up recurring payments — all in INR.",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Get actionable insights",
    description:
      "Review reports, health scores, and AI recommendations to make smarter financial decisions.",
  },
];

export const testimonialsData = [
  {
    name: "Siddharth M.",
    role: "Small Business Owner",
    initials: "SM",
    image: "https://randomuser.me/api/portraits/men/78.jpg",
    quote:
      "WiseWallet transformed how I track business expenses. The category budgets alone saved me hours every month.",
  },
  {
    name: "Shubham M.",
    role: "Software Engineer",
    initials: "SM",
    image: "https://randomuser.me/api/portraits/men/65.jpg",
    quote:
      "The receipt scanner and AI coach are genuinely useful. I finally understand where my money goes each month.",
  },
  {
    name: "Hardik K.",
    role: "Financial Advisor",
    initials: "HK",
    image: "https://randomuser.me/api/portraits/men/44.jpg",
    quote:
      "I recommend WiseWallet to clients who want clarity without complexity. Clean UI and solid analytics.",
  },
  {
    name: "Priya S.",
    role: "Marketing Manager",
    initials: "PS",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    quote:
      "Subscription tracker showed me I was paying for three apps I never used. Saved ₹2,400/month instantly.",
  },
  {
    name: "Rahul V.",
    role: "Startup Founder",
    initials: "RV",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    quote:
      "Health score and monthly reports keep me accountable. Best finance app I've used for personal and business mix.",
  },
  {
    name: "Ananya P.",
    role: "Doctor",
    initials: "AP",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    quote:
      "Simple, fast, and works perfectly in rupees. The savings goals feature helped me build my emergency fund.",
  },
  {
    name: "Vikram J.",
    role: "CA Student",
    initials: "VJ",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    quote:
      "Category-wise budgets and CSV export make month-end reconciliation so much easier for my freelance clients.",
  },
  {
    name: "Neha R.",
    role: "Product Designer",
    initials: "NR",
    image: "https://randomuser.me/api/portraits/women/33.jpg",
    quote:
      "Dark mode, clean dashboard, and AI insights that actually make sense. WiseWallet feels premium and thoughtful.",
  },
];

export const benefitsData = [
  {
    icon: Wallet,
    title: "Built for India",
    description: "Native INR support, Indian date formats, and budgets that match how you actually spend.",
  },
  {
    icon: Shield,
    title: "Secure by design",
    description: "JWT authentication, Google OAuth, and encrypted sessions keep your financial data protected.",
  },
  {
    icon: Target,
    title: "Goal-oriented saving",
    description: "Set savings targets with deadlines and track progress toward what matters most to you.",
  },
  {
    icon: TrendingUp,
    title: "Smarter decisions",
    description: "Financial health scores, trend charts, and AI coaching turn raw data into clear next steps.",
  },
];

export const faqData = [
  {
    q: "Is WiseWallet free to use?",
    a: "Yes — completely free. Create an account, track transactions, set budgets, split bills with friends, and use the AI Finance Coach without paying anything. No hidden fees, no credit card required.",
  },
  {
    q: "Can I sign in with Google and email?",
    a: "Both work. Sign up with email and password, or use Google OAuth in one click. If you use the same email for both, everything stays in one account — your transactions, budgets, and split groups.",
  },
  {
    q: "Does it support Indian Rupees?",
    a: "Built for India, priced in ₹. Every amount, chart, budget, and CSV export uses INR formatting. No currency conversion headaches — what you spend is what you see.",
  },
  {
    q: "How do group splits work?",
    a: "Create a split group, add members, and log shared expenses — just like Splitwise. WiseWallet automatically calculates who owes whom and shows a clear balance summary. Share a link so friends can view or add expenses.",
  },
  {
    q: "Do I need a bank account to use splits?",
    a: "No. Splits are independent of your bank accounts. You can create groups, add expenses, and settle up with friends without linking or selecting any account. Bank accounts are only needed for personal transaction tracking.",
  },
  {
    q: "How does the AI Finance Coach work?",
    a: "Open the AI Coach and ask anything in plain English — \"Where did I overspend last month?\" or \"How can I save more?\" It reads your real transaction history and gives personalized answers powered by Groq AI. No generic tips — advice based on your actual data.",
  },
  {
    q: "Can I track budgets and subscriptions?",
    a: "Yes. Set monthly budgets overall or per category and watch progress bars update in real time. The subscription tracker automatically flags recurring charges — Netflix, Spotify, gym memberships — so you know exactly what's draining your wallet every month.",
  },
  {
    q: "Can I scan receipts instead of typing?",
    a: "Upload a receipt photo and AI extracts the amount, merchant, and category for you. Review the details, hit save, and you're done — no manual entry for every coffee run or grocery bill.",
  },
  {
    q: "Can I export my data?",
    a: "Anytime. Go to Settings and download all your transactions as a CSV file. Your data is yours — export it whenever you need a backup or want to analyze it in Excel or Google Sheets.",
  },
  {
    q: "Does WiseWallet work on mobile?",
    a: "Yes. It's a Progressive Web App — install it on your phone from the browser and it works like a native app. Add it to your home screen for quick access, even with basic offline support.",
  },
  {
    q: "Is my data safe?",
    a: "Your data is stored in a secure PostgreSQL database (Neon) with JWT-authenticated API access. Sessions are managed with refresh tokens — you can log out of all devices from Settings. We never sell or share your financial information.",
  },
  {
    q: "Can I manage multiple bank accounts?",
    a: "Add as many accounts as you need — savings, current, cash, or UPI wallets. Each transaction is linked to an account, and your dashboard shows a unified net worth view across all of them.",
  },
];

export const trustItems = [
  "Google OAuth",
  "JWT Secured",
  "Groq AI",
  "Neon PostgreSQL",
  "Real-time Analytics",
  "CSV Export",
];
