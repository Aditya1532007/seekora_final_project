import { useState } from "react";
import { saveSubscription } from "@/lib/api";
import { showToast } from "@/components/Toast";

interface ContentSectionsProps {
  isSignedIn: boolean;
  onRequireAuth: () => void;
}

export function ContentSections({ isSignedIn, onRequireAuth }: ContentSectionsProps) {
  return (
    <>
      <FeaturesSection />
      <SpotlightSection onSuggestion={(q) => {
        const input = document.querySelector<HTMLInputElement>('#demo input[type="search"]');
        if (input) {
          input.value = q;
          input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        }
      }} />
      <HowItWorksSection />
      <AudienceSection />
      <TechStackSection />
      <PricingSection isSignedIn={isSignedIn} onRequireAuth={onRequireAuth} />
      <RoadmapSection />
      <FaqSection />
      <CtaSection onRequireAuth={onRequireAuth} />
    </>
  );
}

function FeaturesSection() {
  const features = [
    { icon: "✦", title: "AI Answers", desc: "Ask open-ended questions and get a direct answer beyond the saved topic collection." },
    { icon: "⌕", title: "Current Web Search", desc: "Use web search for questions about recent events and other changing information." },
    { icon: "↗", title: "Source Links", desc: "Open clickable sources attached to answers that use web search." },
    { icon: "◷", title: "Search History", desc: "Signed-in users can review and manage their previous searches." },
    { icon: "♙", title: "Account Tools", desc: "Create an account and manage your profile and subscription demo state." },
    { icon: "♫", title: "Voice Input", desc: "Enter a question with browser speech recognition where the browser supports it." },
  ];
  return (
    <section id="features" className="sk-section">
      <span className="tag reveal visible">What You Can Use</span>
      <h2 className="section-title reveal visible">
        The Seekora <span className="grad-text">Toolkit</span>
      </h2>
      <p className="section-sub reveal visible">
        General AI answers, web-grounded information, saved topic context, and account tools.
      </p>
      <div className="grid grid-3">
        {features.map((f, i) => (
          <div key={f.title} className={`card reveal visible ${i === 1 ? "d1" : i === 2 ? "d2" : ""}`}>
            <div className="icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SpotlightSection({ onSuggestion }: { onSuggestion: (q: string) => void }) {
  const topics = [
    { label: "Quantum computing", q: "What is quantum computing?" },
    { label: "Photosynthesis", q: "Explain photosynthesis" },
    { label: "Artificial intelligence", q: "How does AI work?" },
    { label: "Climate change", q: "What is climate change?" },
  ];
  return (
    <section className="sk-section spotlight" aria-label="Seekora featured search ideas">
      <div className="spotlight-card">
        <div>
          <span className="spotlight-kicker">A little curiosity goes a long way</span>
          <h2>Pick a question. Follow the sources.</h2>
          <p>Start with one of these topics from Seekora's local collection. Each matching result includes its saved summary and the source links attached to that topic.</p>
        </div>
        <div className="spotlight-topics">
          {topics.map((t) => (
            <button key={t.label} className="sug" onClick={() => onSuggestion(t.q)}>
              {t.label} ↗
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { title: "Ask Your Question", desc: "Type a question or use voice input where your browser supports it." },
    { title: "Check the Knowledge Base", desc: "Seekora looks for a matching topic in its local collection." },
    { title: "Read the Stored Summary", desc: "See the summary and source links saved with the matching topic." },
    { title: "Keep Your Searches", desc: "Sign in to access your search history and account profile." },
  ];
  return (
    <section id="how" className="sk-section">
      <span className="tag reveal visible">The Process</span>
      <h2 className="section-title reveal visible">
        How It <span className="grad-text">Works</span>
      </h2>
      <p className="section-sub reveal visible">
        Search the local knowledge base and follow the source links attached to a matching topic.
      </p>
      <div className="steps">
        {steps.map((s, i) => (
          <div key={s.title} className={`step reveal visible ${i === 1 ? "d1" : i === 2 ? "d2" : i === 3 ? "d3" : ""}`}>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AudienceSection() {
  const chips = ["School Students", "College Students", "Teachers & Educators", "Researchers", "Professionals", "General Internet Users"];
  return (
    <section id="audience" className="sk-section">
      <span className="tag reveal visible">Customer Segments</span>
      <h2 className="section-title reveal visible">
        Built for <span className="grad-text">Everyone</span>
      </h2>
      <p className="section-sub reveal visible">
        From classrooms to boardrooms — one platform serving every kind of learner.
      </p>
      <div className="chips reveal visible">
        {chips.map((c) => (
          <div key={c} className="chip">
            {c}
          </div>
        ))}
      </div>
    </section>
  );
}

function TechStackSection() {
  const stack = [
    { icon: "🎨", name: "HTML · CSS · JS", type: "Frontend" },
    { icon: "⚛️", name: "React · TypeScript", type: "Frontend" },
    { icon: "🗄️", name: "Supabase", type: "Database" },
    { icon: "🔌", name: "REST API · JSON", type: "Integration" },
    { icon: "🔒", name: "Row Level Security", type: "Security" },
    { icon: "⚙️", name: "Edge Functions", type: "AI Processing" },
  ];
  return (
    <section id="stack" className="sk-section">
      <span className="tag reveal visible">Under the Hood</span>
      <h2 className="section-title reveal visible">
        Our <span className="grad-text">Technology Stack</span>
      </h2>
      <p className="section-sub reveal visible">
        A React frontend backed by Supabase database, edge functions, and AI-powered search.
      </p>
      <div className="stack-grid">
        {stack.map((s, i) => (
          <div key={s.name} className={`stack-item reveal visible ${i === 1 ? "d1" : i === 2 ? "d2" : i === 3 ? "d3" : ""}`}>
            <div className="si">{s.icon}</div>
            <b>{s.name}</b>
            <small>{s.type}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingSection({ isSignedIn, onRequireAuth }: ContentSectionsProps) {
  const [billing, setBilling] = useState<"m" | "y">("m");

  const handleChoosePlan = async (planCode: string) => {
    if (!isSignedIn) {
      onRequireAuth();
      return;
    }
    try {
      const msg = await saveSubscription(planCode, billing === "y" ? "YEARLY" : "MONTHLY");
      showToast(msg);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not select plan.");
    }
  };

  return (
    <section id="pricing" className="sk-section">
      <span className="tag reveal visible">Demo Plans</span>
      <h2 className="section-title reveal visible">
        Seekora <span className="grad-text">Demo Plans</span>
      </h2>
      <p className="section-sub reveal visible">Demo plan selection only. No payment is processed.</p>
      <div className="billing-toggle reveal visible">
        <button className={billing === "m" ? "on" : ""} onClick={() => setBilling("m")}>
          Monthly
        </button>
        <button className={billing === "y" ? "on" : ""} onClick={() => setBilling("y")}>
          Yearly <span style={{ fontSize: "0.7rem", color: "var(--green)", fontWeight: 800 }}>Demo</span>
        </button>
      </div>
      <div className="pricing-grid">
        <div className="price-card reveal visible">
          <h3>Freemium</h3>
          <div className="price">
            $0<small>/month</small>
          </div>
          <ul>
            <li>Knowledge base search</li>
            <li>10 searches per day</li>
            <li>Source links included</li>
            <li>Web application access</li>
          </ul>
          <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onRequireAuth}>
            Start Free
          </button>
        </div>
        <div className="price-card featured reveal visible d1">
          <span className="badge">Demo plan</span>
          <h3>Premium</h3>
          <div className="price">
            {billing === "m" ? "$9" : "$7"}
            <small>/month</small>
          </div>
          <ul>
            <li>Unlimited knowledge base searches</li>
            <li>Stored topic summaries</li>
            <li>Saved search history</li>
            <li>Profile management</li>
            <li>Browser voice input</li>
            <li>JSON API endpoints</li>
          </ul>
          <button className="btn" style={{ width: "100%" }} onClick={() => handleChoosePlan("PREMIUM")}>
            Select Premium Demo
          </button>
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  const items = [
    { title: "Voice Input & AI Assistant", desc: "Ask an open-ended question by typing or using browser voice input where available." },
    { title: "PDF Upload & Analysis", desc: "Upload documents and get instant AI-powered summaries and insights." },
    { title: "Mobile Application", desc: "Native iOS and Android apps for learning on the go." },
    { title: "Multi-language Support", desc: "Breaking language barriers to make knowledge truly universal." },
    { title: "Personalized Recommendations", desc: "Smarter suggestions tailored to your learning journey and interests." },
  ];
  return (
    <section id="roadmap" className="sk-section">
      <span className="tag reveal visible">Future Scope</span>
      <h2 className="section-title reveal visible">
        Where We're <span className="grad-text">Headed</span>
      </h2>
      <p className="section-sub reveal visible">Ideas for future versions of Seekora.</p>
      <div className="timeline">
        {items.map((item) => (
          <div key={item.title} className="tl-item reveal visible">
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    { q: "What can I ask Seekora?", a: "Ask general questions, request explanations, or ask about current information. The AI service can search the web and provide sources when useful." },
    { q: "Does Seekora show sources?", a: "Answers that use web search show clickable source links. Saved topics use the sources stored with their summaries." },
    { q: "Can I save my searches?", a: "Signed-in users can view and manage their search history. Guest searches are not saved to an account." },
    { q: "Does Premium process a payment?", a: "No. Plan selection demonstrates the subscription flow; no payment gateway is connected." },
  ];
  return (
    <section id="faq" className="sk-section">
      <span className="tag reveal visible">Got Questions?</span>
      <h2 className="section-title reveal visible">
        Frequently Asked <span className="grad-text">Questions</span>
      </h2>
      <p className="section-sub reveal visible">What to expect from the current Seekora demo.</p>
      <div className="faq">
        {faqs.map((f, i) => (
          <div key={i} className={`faq-item ${openIdx === i ? "open" : ""}`}>
            <button className="faq-q" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              {f.q}
              <span>+</span>
            </button>
            <div className="faq-a" style={{ maxHeight: openIdx === i ? "200px" : "0" }}>
              <p>{f.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaSection({ onRequireAuth }: { onRequireAuth: () => void }) {
  return (
    <section id="cta" className="sk-section cta-section">
      <h2 className="section-title reveal visible">
        Ready to <span className="grad-text">Try Seekora?</span>
      </h2>
      <p className="section-sub reveal visible">
        Create an account to keep your search history and manage your profile.
      </p>
      <button
        className="btn reveal visible"
        style={{ fontSize: "1.02rem", padding: "17px 46px" }}
        onClick={onRequireAuth}
      >
        Create Free Account
      </button>
    </section>
  );
}
