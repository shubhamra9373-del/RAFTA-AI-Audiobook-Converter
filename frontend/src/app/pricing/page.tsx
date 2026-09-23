"use client";

import Link from "next/link";
import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import AuthGuard from "../../components/AuthGuard";

interface Plan {
  name: string;
  subtitle: string;
  price: string;
  period: string;
  popular?: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    name: "Free",
    subtitle: "Try the RAFTA workspace",
    price: "₹0",
    period: "forever",
    features: [
      "Basic audiobook generation",
      "TXT text support",
      "Standard AI voices",
      "Book Library",
      "Generated Audio storage",
      "MP3 playback",
    ],
  },
  {
    name: "Creator",
    subtitle: "For regular audiobook creators",
    price: "₹499",
    period: "per month",
    popular: true,
    features: [
      "Everything in Free",
      "More audiobook generation",
      "More AI voice options",
      "TXT, PDF and EPUB workflow",
      "Priority generation",
      "Dedicated audio player",
      "Faster workspace experience",
    ],
  },
  {
    name: "Studio",
    subtitle: "For heavy audiobook workflows",
    price: "₹999",
    period: "per month",
    features: [
      "Everything in Creator",
      "Higher generation limits",
      "Advanced voice selection",
      "Large book workflows",
      "Priority processing",
      "Extended audio management",
      "Professional workspace",
    ],
  },
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] =
    useState("Creator");

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName);
  };

  return (
    <AuthGuard>
      <main className="pricing-page">
        <Sidebar />

        <section className="pricing-content">
          <header className="pricing-header">
            <div>
              <div className="breadcrumb">
                <span>RAFTA</span>
                <b>/</b>
                <span>Pricing</span>
              </div>

              <h1>Choose Your Plan</h1>

              <p>
                Select the plan that fits your audiobook workflow.
                Start simple and upgrade when you need more.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="pricing-dashboard-btn"
            >
              ← Dashboard
            </Link>
          </header>

          <section className="pricing-hero">
            <div className="pricing-hero-glow"></div>

            <div className="pricing-hero-content">
              <span>RAFTA AI AUDIOBOOK</span>

              <h2>
                Simple plans for
                <strong> better listening.</strong>
              </h2>

              <p>
                Build your book library, generate natural AI
                audiobooks, and manage your finished audio from one
                organized workspace.
              </p>
            </div>

            <div className="pricing-hero-badge">
              <span>✦</span>

              <div>
                <strong>Flexible Workspace</strong>

                <small>
                  Upgrade as your needs grow
                </small>
              </div>
            </div>
          </section>

          <section className="pricing-switch">
            <button type="button" className="active">
              Monthly
            </button>

            <span>Simple pricing</span>
          </section>

          <section className="pricing-grid">
            {plans.map((plan) => {
              const active =
                selectedPlan === plan.name;

              return (
                <article
                  key={plan.name}
                  className={`pricing-card ${
                    plan.popular
                      ? "pricing-popular"
                      : ""
                  } ${
                    active
                      ? "pricing-selected"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="pricing-popular-badge">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="pricing-card-top">
                    <div>
                      <span className="pricing-plan-icon">
                        {plan.name === "Free"
                          ? "○"
                          : plan.name === "Creator"
                          ? "✦"
                          : "◆"}
                      </span>

                      <h2>{plan.name}</h2>

                      <p>{plan.subtitle}</p>
                    </div>
                  </div>

                  <div className="pricing-price">
                    <strong>{plan.price}</strong>

                    <span>{plan.period}</span>
                  </div>

                  <div className="pricing-divider"></div>

                  <div className="pricing-feature-title">
                    INCLUDED
                  </div>

                  <div className="pricing-features">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="pricing-feature"
                      >
                        <span>✓</span>

                        <p>{feature}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handlePlanSelect(plan.name)
                    }
                    className={`pricing-plan-btn ${
                      active ? "selected" : ""
                    }`}
                  >
                    {active
                      ? "Selected Plan"
                      : `Choose ${plan.name}`}
                  </button>
                </article>
              );
            })}
          </section>

          <section className="pricing-selected-bar">
            <div className="pricing-selected-icon">
              ✓
            </div>

            <div>
              <span>CURRENT SELECTION</span>

              <h2>{selectedPlan} Plan</h2>

              <p>
                Your selected pricing option is ready.
              </p>
            </div>

            <Link
              href="/create"
              className="pricing-start-btn"
            >
              ✦ Start Creating
            </Link>
          </section>

          <section className="pricing-comparison">
            <div className="pricing-section-heading">
              <span>COMPARE</span>

              <h2>Workspace Features</h2>

              <p>
                See how the plans differ across the RAFTA
                audiobook workflow.
              </p>
            </div>

            <div className="pricing-table">
              <div className="pricing-table-row pricing-table-header">
                <strong>Feature</strong>
                <strong>Free</strong>
                <strong>Creator</strong>
                <strong>Studio</strong>
              </div>

              <div className="pricing-table-row">
                <span>Audiobook generation</span>
                <span>✓</span>
                <span>✓</span>
                <span>✓</span>
              </div>

              <div className="pricing-table-row">
                <span>Book Library</span>
                <span>✓</span>
                <span>✓</span>
                <span>✓</span>
              </div>

              <div className="pricing-table-row">
                <span>Generated Audio</span>
                <span>✓</span>
                <span>✓</span>
                <span>✓</span>
              </div>

              <div className="pricing-table-row">
                <span>AI voice options</span>
                <span>Basic</span>
                <span>More</span>
                <span>Advanced</span>
              </div>

              <div className="pricing-table-row">
                <span>Generation capacity</span>
                <span>Basic</span>
                <span>High</span>
                <span>Higher</span>
              </div>

              <div className="pricing-table-row">
                <span>Priority processing</span>
                <span>—</span>
                <span>✓</span>
                <span>✓</span>
              </div>

              <div className="pricing-table-row">
                <span>Dedicated Player</span>
                <span>✓</span>
                <span>✓</span>
                <span>✓</span>
              </div>
            </div>
          </section>

          <section className="pricing-workflow">
            <div className="pricing-section-heading">
              <span>RAFTA WORKFLOW</span>

              <h2>One Workspace</h2>

              <p>
                Every plan follows the same simple audiobook
                workflow.
              </p>
            </div>

            <div className="pricing-workflow-grid">
              <article>
                <div>01</div>

                <span>↑</span>

                <h3>Upload</h3>

                <p>
                  Add your book to the RAFTA Book Library.
                </p>
              </article>

              <article>
                <div>02</div>

                <span>📚</span>

                <h3>Organize</h3>

                <p>
                  Keep original books separate from finished audio.
                </p>
              </article>

              <article>
                <div>03</div>

                <span>✦</span>

                <h3>Generate</h3>

                <p>
                  Choose a voice and create your audiobook.
                </p>
              </article>

              <article>
                <div>04</div>

                <span>🎧</span>

                <h3>Listen</h3>

                <p>
                  Play and download your finished MP3.
                </p>
              </article>
            </div>
          </section>

          <section className="pricing-cta">
            <div>
              <span>READY TO CREATE?</span>

              <h2>
                Start building your
                <strong> audiobook library.</strong>
              </h2>

              <p>
                You can start with the basic workspace and upgrade
                later as your audiobook needs grow.
              </p>
            </div>

            <div className="pricing-cta-actions">
              <Link
                href="/create"
                className="pricing-cta-primary"
              >
                ✦ Create Audiobook
              </Link>

              <Link
                href="/upload"
                className="pricing-cta-secondary"
              >
                ↑ Upload Book
              </Link>
            </div>
          </section>

          <footer className="pricing-footer">
            <span>RAFTA AI</span>

            <p>
              Pricing · AI Audiobook Workspace
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}