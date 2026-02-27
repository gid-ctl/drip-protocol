import { Link } from "react-router-dom";
import { Droplets, ArrowRight, Zap, Shield, Clock, TrendingUp, XCircle, Eye, Briefcase, Lock, Palette, Landmark, ChevronDown, Layers, Globe, Code, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { StreamVisualization } from "@/components/StreamVisualization";
import { ThemePreview } from "@/components/ThemePreview";
import { NetworkAlert } from "@/components/NetworkAlert";
import { useState } from "react";
import { useProtocolStats } from "@/hooks/use-protocol-stats";
import { useWallet } from "@/contexts/WalletContext";

const FEATURES = [
  { icon: Zap, title: "Real-Time Payments", desc: "Bitcoin streams continuously, block by block" },
  { icon: Shield, title: "Trustless Escrow", desc: "Smart contract holds funds securely on-chain" },
  { icon: Clock, title: "Instant Access", desc: "Withdraw vested funds at any time" },
  { icon: TrendingUp, title: "Linear Vesting", desc: "Predictable, proportional token distribution" },
  { icon: XCircle, title: "Cancel Anytime", desc: "Senders can cancel and reclaim unvested funds" },
  { icon: Eye, title: "Full Transparency", desc: "Every transaction verifiable on the blockchain" },
];

const STEPS = [
  { num: "01", title: "Create", desc: "Set recipient, amount & duration" },
  { num: "02", title: "Lock", desc: "sBTC is escrowed in the contract" },
  { num: "03", title: "Stream", desc: "Funds vest linearly over time" },
  { num: "04", title: "Withdraw", desc: "Recipient claims vested sBTC" },
];

const USE_CASES = [
  { icon: Briefcase, title: "Payroll Streaming", short: "Pay your team every second, not every two weeks.", detail: "Stream salaries to employees continuously. Workers earn every block, reducing payroll overhead and giving instant access to earned wages without waiting for pay cycles." },
  { icon: Lock, title: "Token Vesting", short: "Fair, transparent token distribution for investors and teams.", detail: "Replace complex vesting contracts with simple streams. Tokens vest linearly with full on-chain transparency, and unvested tokens can be reclaimed if needed." },
  { icon: Palette, title: "Creator Economy", short: "Subscription payments that flow in real-time.", detail: "Fans stream payments to creators continuously. No more monthly billing cycles — creators earn as they create, and subscribers only pay for the time they're subscribed." },
  { icon: Landmark, title: "DAO Treasury", short: "Programmable treasury disbursements for DAOs.", detail: "Stream grants and contributor payments from DAO treasuries. Governance can cancel streams if milestones aren't met, maintaining accountability with on-chain proof." },
];

const TRUST_BADGES = [
  { icon: Layers, label: "Built on Stacks" },
  { icon: Globe, label: "100% On-Chain" },
  { icon: Code, label: "Open Source" },
  { icon: ShieldCheck, label: "Non-Custodial" },
];

const FAQ_ITEMS = [
  { q: "What is sBTC?", a: "sBTC is a decentralized Bitcoin peg on the Stacks blockchain that lets you use BTC in smart contracts while maintaining Bitcoin's security." },
  { q: "How does DRIP streaming work?", a: "You lock sBTC in a smart contract specifying a recipient and duration. The contract vests funds linearly — the recipient can withdraw their earned portion at any time." },
  { q: "Are there any fees?", a: "DRIP charges no protocol fees. You only pay standard Stacks network transaction fees for creating, withdrawing from, or cancelling a stream." },
  { q: "Is it secure?", a: "DRIP uses audited Clarity smart contracts on Stacks. Funds are held in a non-custodial escrow — neither DRIP nor any third party can access your sBTC." },
  { q: "Can I cancel a stream?", a: "Yes. The sender can cancel an active stream at any time. Vested funds go to the recipient, and unvested funds are returned to the sender." },
  { q: "What wallets are supported?", a: "DRIP works with any Stacks-compatible wallet, including Leather (formerly Hiro Wallet) and Xverse." },
];

const FOOTER_LINKS = {
  Product: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Create Stream", to: "/create" },
    { label: "History", to: "/history" },
    { label: "Docs", href: "#" },
  ],
  Community: [
    { label: "Twitter", href: "#" },
    { label: "Discord", href: "#" },
    { label: "GitHub", href: "#" },
  ],
  Legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ],
};

const viewportOnce = { once: true, margin: "-50px" as any };

export default function Index() {
  // Fetch real protocol statistics from the blockchain
  const { totalStreamed, activeStreams, totalTransactions, loading, error } = useProtocolStats();
  const { connected } = useWallet();
  
  // Build protocol stats array from real data
  const protocolStats = [
    { value: loading ? 0 : totalStreamed, decimals: 2, suffix: " sBTC", label: "Total Streamed" },
    { value: loading ? 0 : activeStreams, decimals: 0, suffix: "", label: "Active Streams" },
    { value: loading ? 0 : totalTransactions, decimals: 0, suffix: "+", label: "Transactions" },
  ];
  
  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero */}
      <header className="container flex flex-col items-center justify-center py-16 md:py-28 lg:py-36 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-[300px] h-[300px] rounded-full border border-primary/10 animate-[ripple_3s_ease-out_infinite]" />
          <div className="absolute inset-0 w-[300px] h-[300px] rounded-full border border-primary/5 animate-[ripple_3s_ease-out_1s_infinite]" />
        </div>

        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl"
          >
            Bitcoin that{" "}
            <span className="text-gradient-flow">flows.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Stream sBTC payments in real-time on Stacks. Create trustless payment streams for payroll, vesting, and more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-3 gap-4 sm:gap-8 mb-10 max-w-md sm:max-w-none mx-auto"
          >
            {protocolStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-gradient-primary">
                  <AnimatedNumber value={stat.value} decimals={stat.decimals} suffix={stat.suffix} duration={1800} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="w-full sm:w-auto gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity gap-2 text-base px-8">
              <Link to="/dashboard">
                Launch App
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-border/50 text-base px-8">
              <a href="#features">Learn More</a>
            </Button>
          </motion.div>

          {/* Network Alert - only show when wallet not connected */}
          {!connected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="max-w-2xl mx-auto"
            >
              <NetworkAlert />
            </motion.div>
          )}

          {/* Stream Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <StreamVisualization />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <ThemePreview />
          </motion.div>
        </div>
      </header>

      {/* Social Proof Strip */}
      <section className="container pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
          {TRUST_BADGES.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm text-muted-foreground"
            >
              <badge.icon className="h-4 w-4 text-primary" />
              {badge.label}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why DRIP?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">A new primitive for programmable Bitcoin payments</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group relative rounded-xl border border-border/50 bg-card/50 p-6 transition-all hover:border-primary/20 hover:shadow-card-hover overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/60 transition-all duration-300" />
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-200 group-hover:scale-110">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Four simple steps to stream Bitcoin</p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-[12.5%] right-[12.5%] h-px border-t-2 border-dashed border-border/40 -translate-y-1/2 z-0" />
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:hidden absolute left-6 top-8 bottom-8 w-px border-l-2 border-dashed border-border/40 z-0" />
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={viewportOnce}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="relative rounded-xl border border-border/50 bg-card/80 p-6 z-10"
              >
                <span className="text-4xl font-extrabold text-gradient-primary opacity-60">{s.num}</span>
                <h3 className="text-lg font-semibold mt-3 mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Use Cases</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Real-world applications for streaming payments</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((uc, i) => (
            <UseCaseCard key={uc.title} useCase={uc} index={i} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to know about DRIP</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border/50 bg-card/50 px-6 data-[state=open]:border-primary/20 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-primary/20 gradient-card p-8 sm:p-12 text-center glow-amber"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to start streaming?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create your first sBTC payment stream in minutes.
          </p>
          <Button asChild size="lg" className="w-full sm:w-auto gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity gap-2 text-base px-8">
            <Link to="/dashboard">
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="container py-12 sm:py-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold text-foreground">DRIP Protocol</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Real-time sBTC payment streaming on Stacks. Programmable, trustless, and fully on-chain.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      {"to" in link ? (
                        <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>© 2026 DRIP Protocol. All rights reserved.</p>
            <p>Built on Stacks. Powered by Bitcoin.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function UseCaseCard({ useCase, index }: { useCase: typeof USE_CASES[0]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 transition-all hover:border-primary/20">
          <CollapsibleTrigger className="flex items-start gap-4 w-full text-left cursor-pointer">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <useCase.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold mb-1">{useCase.title}</h3>
              <p className="text-sm text-muted-foreground">{useCase.short}</p>
            </div>
            <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 pl-14">
            <p className="text-sm text-muted-foreground leading-relaxed">{useCase.detail}</p>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  );
}
