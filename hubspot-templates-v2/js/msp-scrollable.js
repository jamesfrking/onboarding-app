let iconRefreshScheduled = false;
function refreshIcons() {
  if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;
  if (iconRefreshScheduled) return;
  iconRefreshScheduled = true;
  requestAnimationFrame(() => {
    try {
      window.lucide.createIcons();
    } finally {
      iconRefreshScheduled = false;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', refreshIcons);
} else {
  refreshIcons();
}

(function() {
  const stageIds = ['mission-hero', 'mission-briefing', 'mission-persona', 'mission-goal', 'mission-readiness', 'mission-cta'];
  const state = {
    persona: null,
    goal: null,
    pain: null,
    priority: 70,
    cta: null,
    email: null,
    mspOffers: [],
    targetCustomerSize: '',
    regionsServed: [],
    whiteLabelRequired: '',
    advisorFocus: [],
    coBrandRequired: '',
    timeToStart: '',
    processOwner: '',
    activeCustomerBand: '',
    introAccounts30d: '',
    kickoffWindow: '',
    execSponsorNamed: '',
    weeklyTimeCommitment: '',
    // SI-specific state
    siFocus: [],
    projectLengthBand: '',
    verticals: [],
    siProcurementModel: '',
    // Distributor-specific state
    distributorFocus: [],
    activeResellerBand: '',
    dealRegPriceProtect: '',
    mdfAvailable: '',
    varActivationMotion: '',
    introVars30d: '',
    marketplaces: [],
    programLevers: [],
    enablementPlan: '',
    varEnablementPath: '',
    bundleSkuReady: '',
    subscribeForUpdates: '',
    stage1Collateral: false,
    stage2Collateral: false,
    stage3Collateral: false,
    unlockedIndex: 0,
    currentStage: stageIds[0]
  };

  // Map UI goal keys to canonical keys for config/CTA/story lookups
  function normalizeGoalKey(key) {
    switch (key) {
      case 'build_recurring': return 'recurring';
      case 'project_services': return 'services';
      case 'retention_upsell': return 'retention';
      case 'co_sell': return 'cosell';
      default: return key;
    }
  }
  let scrollLocked = false;

  // ============================================
  // EDIT SECTION 1: PERSONA DYNAMIC TEXT
  // ============================================
  // This controls the text that appears in the console
  // after a visitor selects their persona.
  // Edit: telemetry, subtext, and hero messages.
  // ============================================
  const personaConfig = {
    msp: {
      label: 'Managed Service Provider',
      short: 'MSP',
      telemetry: 'MSP signal locked. Continuous visibility and SLA-backed delivery motions engaged.',
      subtext: 'Embed WanAware in your managed offerings to deliver proactive monitoring, SLA assurance, and executive-ready reporting.',
      hero: 'Delivering continuous visibility without agent sprawl.'
    },
    distributor: {
      label: 'Distributor',
      short: 'Distributor',
      telemetry: 'Distributor network detected. White-label enablement and margin control systems online.',
      subtext: 'Equip your reseller network with observability portals, partner kits, and margin controls that scale.',
      hero: 'Multiplying reach and returns across your ecosystem.'
    },
    si: {
      label: 'System Integrator',
      short: 'SI',
      telemetry: 'SI integration path synced. Modernization de-risking and compliance evidence ready.',
      subtext: 'Integrate observability into transformation programs to accelerate outcomes and satisfy compliance on day one.',
      hero: 'Engineering outcomes without overhead.'
    },
    advisor: {
      label: 'Technology Advisor',
      short: 'Advisor',
      telemetry: 'Advisory signal received. Referral tracking and recurring payout engine activated.',
      subtext: 'Refer qualified opportunities and earn predictable, recurring payouts.',
      hero: 'Guiding clients to visibility with zero overhead.'
    }
  };

  // ============================================
  // EDIT SECTION 2: TELEMETRY MESSAGES
  // ============================================
  // These messages appear in the console based on
  // the persona + goal combination selected.
  // Edit the text in quotes for each scenario.
  // ============================================
  // Client-relevant signal recipes per persona × goal
  const telemetryRecipes = {
    msp: {
      recurring: [
        'Revenue target: +20–30% MRR in 2 quarters.',
        'Levers: tiered bundles, usage-based add‑ons, automation loops.',
        'KPI: churn < 3% and attach rate +12 pts.'
      ],
      services: [
        'Launch target: 1–2 managed offers in <30 days.',
        'Levers: packaged SLAs, deployment playbooks, co-branded collateral.',
        'KPI: service attach to new deals +15 pts.'
      ],
      retention: [
        'Outcome: health score > 75 and NRR > 110%.',
        'Levers: QBR automation, usage telemetry, advocacy loops.',
        'KPI: expansion opportunities per account +2.'
      ],
      cosell: [
        'Motion: stand up 3 active co‑sell plays.',
        'Levers: marketplace listing, shared pipeline, MDF activation.',
        'KPI: cycle time −20%, win rate +8 pts.'
      ]
    },
    advisor: {
      recurring: [
        'Payout model: conversion + renewal commissions.',
        'Levers: deal registration, attribution tracking, portal visibility.',
        'KPI: qualified referrals and payout predictability.'
      ],
      services: [
        'Motion: advisor kit deployment in <7 days.',
        'Levers: discovery prompts, light demo script, qualification checklist.',
        'KPI: first-meeting → proposal conversion rate.'
      ],
      retention: [
        'Outcome: protect recurring commission stream.',
        'Levers: account tracking, renewal notifications, client success insights.',
        'KPI: referred account retention rate and payout continuity.'
      ],
      cosell: [
        'Motion: protect opportunity via deal registration.',
        'Levers: outcome-first demos, distributor routes, marketplace access.',
        'KPI: ownership clarity and procurement cycle compression.'
      ]
    },
    distributor: {
      recurring: [
        'Network play: enable partners for monthly revenue packs.',
        'Levers: pricing guardrails, catalogue, incentives.',
        'KPI: partner activation rate and monthly run‑rate.'
      ],
      services: [
        'Program: productize offers across the ecosystem.',
        'Levers: turnkey kits, delivery standards, marketplace placements.',
        'KPI: partners selling services in 45 days.'
      ],
      retention: [
        'Scale: portfolio of lifecycle campaigns partners can adopt.',
        'Levers: QBR templates, telemetry feeds, renewal sequences.',
        'KPI: attach renewals across long tail.'
      ],
      cosell: [
        'Motion: marketplace acceleration across territories.',
        'Levers: listing optimization, incentives, joint calendar.',
        'KPI: listing traffic +200%, registered deals up.'
      ]
    },
    si: {
      recurring: [
        'Model: bundle managed services into transformation deals.',
        'Levers: outcome SLAs, success metrics, value realization.',
        'KPI: NRR and post‑sale expansion within 120 days.'
      ],
      services: [
        'Program: accelerate complex service launches.',
        'Levers: governance model, change management kit, delivery runbooks.',
        'KPI: time‑to‑first‑value and deployment variance.'
      ],
      retention: [
        'Outcome: executive‑ready proof across lifecycle.',
        'Levers: health reviews, telemetry narrative, advocacy pipeline.',
        'KPI: executive satisfaction and renewal predictability.'
      ],
      cosell: [
        'Motion: unify co‑sell for enterprise programs.',
        'Levers: shared pipeline, governance, field activation.',
        'KPI: enterprise win rate and stage advancement speed.'
      ]
    }
  };

  const painRemedies = {
    pipeline: 'Increase top‑of‑funnel and visibility with shared telemetry and targeted campaigns.',
    packaging: 'Standardize pricing and offer templates; arm sellers with battlecards and ROI proofs.',
    enablement: 'Launch a certification track and content hub; 30‑minute field enablement session.',
    automation: 'Automate QBRs, renewals, and ticket routing to free delivery capacity.'
  };

  // ============================================
  // EDIT SECTION 3: GOAL DYNAMIC TEXT
  // ============================================
  // This controls the text that appears in the console
  // after a visitor selects their goal.
  // Edit: descriptor and telemetry messages.
  // ============================================
  const goalConfig = {
    // Canonical goals (used across all personas)
    recurring: {
      label: 'Grow recurring revenue',
      descriptor: 'Engineer subscription bundles, automation playbooks, and pricing motions that boost MRR.',
      telemetry: 'Recurring revenue engines fueled.',
      sliderLegend: 'Subscription surge level',
      personas: ['msp', 'distributor', 'si', 'advisor'],
      icon: 'repeat',
      iconColor: 'cyan'
    },
    services: {
      label: 'Launch new managed services',
      descriptor: 'Productize offers faster with deployment blueprints, enablement paths, and co-branded assets.',
      telemetry: 'Managed service launch countdown initiated.',
      sliderLegend: 'Go-live readiness',
      personas: ['msp', 'distributor', 'si', 'advisor'],
      icon: 'rocket',
      iconColor: 'sky'
    },
    retention: {
      label: 'Strengthen client retention',
      descriptor: 'Instrument experience dashboards, QBR automation, and customer marketing cadences.',
      telemetry: 'Retention command center online.',
      sliderLegend: 'Advocacy momentum',
      personas: ['msp', 'distributor', 'si', 'advisor'],
      icon: 'shield',
      iconColor: 'blue'
    },
    cosell: {
      label: 'Accelerate co-sell velocity',
      descriptor: 'Orchestrate marketplace offers, shared pipeline visibility, and field activation campaigns.',
      telemetry: 'Co-sell velocity boosters engaged.',
      sliderLegend: 'Joint motion intensity',
      personas: ['msp', 'distributor', 'si', 'advisor'],
      icon: 'link',
      iconColor: 'purple'
    },
    build_recurring: {
      label: 'Build recurring advisory',
      descriptor: 'Turn introductions into predictable conversion and renewal payouts with attribution baked in.',
      telemetry: 'Recurring advisory motion tuned.',
      sliderLegend: 'Momentum to recurring payout',
      personas: ['advisor'],
      icon: 'repeat',
      iconColor: 'cyan'
    },
    project_services: {
      label: 'Paid assessment / project',
      descriptor: 'Stand up advisory-led discovery and launch projects with WanAware delivery backing.',
      telemetry: 'Assessment + project play assembled.',
      sliderLegend: 'Assessment launch cadence',
      personas: ['advisor'],
      icon: 'rocket',
      iconColor: 'sky'
    },
    retention_upsell: {
      label: 'Retention / QBR uplift',
      descriptor: 'Lead renewals with outcomes, QBR narratives, and executive-ready proof.',
      telemetry: 'Retention uplift kit activated.',
      sliderLegend: 'Renewal proof readiness',
      personas: ['advisor'],
      icon: 'shield',
      iconColor: 'blue'
    },
    co_sell: {
      label: 'Co-sell with vendor / ISV',
      descriptor: 'Align on deal registration, shared pipeline, and field activation for joint wins.',
      telemetry: 'Co-sell coordination online.',
      sliderLegend: 'Joint motion intensity',
      personas: ['advisor'],
      icon: 'link',
      iconColor: 'purple'
    },
    enablement: {
      label: 'Scale partner enablement',
      descriptor: 'Certification programs, content hubs, and field activation campaigns that mobilize your network.',
      telemetry: 'Partner enablement infrastructure online.',
      sliderLegend: 'Enablement reach',
      personas: ['distributor'], // Distributor only
      icon: 'graduation-cap',
      iconColor: 'emerald'
    },
    marketplace: {
      label: 'Expand marketplace presence',
      descriptor: 'Listing optimization, co-marketing campaigns, and transactable offer strategies.',
      telemetry: 'Marketplace expansion protocols active.',
      sliderLegend: 'Market penetration',
      personas: ['distributor'], // Distributor only
      icon: 'store',
      iconColor: 'amber'
    },
    transformation: {
      label: 'Drive enterprise transformation',
      descriptor: 'Outcome-based delivery models, executive alignment frameworks, and value realization tracking.',
      telemetry: 'Enterprise transformation playbooks loaded.',
      sliderLegend: 'Transformation velocity',
      personas: ['si'], // SI only
      icon: 'trending-up',
      iconColor: 'indigo'
    }
  };

  // Persona-specific goal descriptors
  const personaGoalDescriptors = {
    advisor: {
      build_recurring: { label: 'Build Recurring Income', descriptor: 'Turn qualified introductions into conversion and renewal payouts with clean, portal-tracked attribution.' },
      project_services: { label: 'Launch With No Overhead', descriptor: 'Open doors using the Advisor Kit (discovery prompts + light demo) while WanAware handles onboarding and ops.' },
      retention_upsell: { label: 'Strengthen Executive Buy-In', descriptor: 'Use outcome-first proof (uptime, UX, risk) to anchor renewal conversations in business value.' },
      co_sell: { label: 'Accelerate Co-Sell', descriptor: 'Register deals in minutes and tap field alignment + marketplace routes to compress time-to-close.' }
    },
    msp: {
      recurring: { label: 'Grow MRR Bundles', descriptor: 'Attach tiered visibility packages with SLA-backed reporting and proactive incident workflows to every contract.' },
      services: { label: 'Productize Fast', descriptor: 'Ship a managed observability SKU via deployment blueprints, starter runbooks, and prebuilt SLA widgets.' },
      retention: { label: 'Reduce Churn', descriptor: 'Make service health obvious in QBRs with branded dashboards and dependency insights that prevent surprises.' },
      cosell: { label: 'Win Faster Together', descriptor: 'Use deal-reg, shared pipeline views, and outcome-linked demos to speed buying cycles and raise win rate.' }
    },
    distributor: {
      recurring: { label: 'Ecosystem MRR Engine', descriptor: 'Scale recurring revenue through downstream partners with clear volume tiers, rebates, and margin controls.' },
      services: { label: 'One-Click Partner Launch', descriptor: 'Automate provisioning, theme child portals, and push enablement kits to activate resellers at pace.' },
      retention: { label: 'Raise Network Quality', descriptor: 'Standardize excellence with proof kits, shared health dashboards, and a repeatable enablement bench.' },
      cosell: { label: 'Amplify Territory', descriptor: 'Align our field with yours, leverage MDF, and run portable proof/ROI plays to expand regional coverage.' }
    },
    si: {
      recurring: { label: 'Add Recurring Streams', descriptor: 'Attach post-project managed visibility to stabilize outcomes and monetize ongoing assurance.' },
      services: { label: 'De-Risk Delivery', descriptor: 'Use topology discovery, dependency maps, and API-first integrations to accelerate cutovers and reduce rollbacks.' },
      retention: { label: 'Compliance on Day One', descriptor: 'Provide SOC 2/ISO evidence straight from live telemetry to keep audits clean and sponsors aligned.' },
      cosell: { label: 'Enterprise Co-Sell', descriptor: 'Run executive-level briefs that tie telemetry to KPIs, supported by accelerators and industry playbooks.' }
    }
  };

  const painConfig = {
    pipeline: {
      label: 'Pipeline coverage',
      detail: 'Need aligned campaigns and partner pipeline transparency.'
    },
    packaging: {
      label: 'Offer packaging',
      detail: 'Need pricing, positioning, and messaging to land with buyers fast.'
    },
    enablement: {
      label: 'Partner enablement',
      detail: 'Need content, certifications, and plays to mobilize sellers.'
    },
    automation: {
      label: 'Manual workflows',
      detail: 'Need to automate QBRs, renewals, and lifecycle comms.'
    }
  };

  // ============================================
  // EDIT SECTION 4: STORY CARDS (Stage 3)
  // ============================================
  // These are the 3 story cards that appear for each persona × goal.
  // Cards are persona-specific and adapt based on selection.
  // Edit: title, badge, stat, and copy text for each card.
  // ============================================
  const storyDeck = {
    // Generic fallback (shown if persona not matched)
    recurring: [
      {
        title: 'Package Managed Visibility',
        badge: 'MRR',
        stat: 'Partners lift MRR when visibility is attached',
        icon: 'gauge',
        copy: () => `Tiered bundles with SLA-backed reporting and proactive incident workflows.`
      },
      {
        title: 'Close the Ticket Loop',
        badge: 'Automation',
        stat: 'Manual tickets drop with API automation',
        icon: 'circuit-board',
        copy: () => `Open, enrich, and resolve via ITSM API to cut manual load and MTTR.`
      },
      {
        title: 'Your Brand, Our Engine',
        badge: 'White-Label',
        stat: 'Upsell close improves when value is shown monthly',
        icon: 'presentation',
        copy: () => `Branded dashboards and reports keep value visible in each QBR.`
      }
    ],
    services: [
      {
        title: 'From Runbook to SKU',
        badge: 'Blueprints',
        stat: 'Launch managed visibility offers in days',
        icon: 'factory',
        copy: () => `Deployment scripts and starter runbooks accelerate productization.`
      },
      {
        title: 'Executive-Ready Reports',
        badge: 'SLA',
        stat: 'QBR preparation becomes repeatable and fast',
        icon: 'map',
        copy: () => `Prebuilt SLA widgets and summaries reduce prep time for CSMs.`
      },
      {
        title: 'Launch with Air Cover',
        badge: 'Co-Marketing',
        stat: 'More partner-sourced opportunities per rep',
        icon: 'megaphone',
        copy: () => `Case studies, pricing cards, and campaigns to seed pipeline.`
      }
    ],
    retention: [
      {
        title: 'Make Service Health Obvious',
        badge: 'Health',
        stat: 'Fewer renewal surprises; stronger narratives',
        icon: 'heartbeat',
        copy: () => `Dashboards surface risk and dependency paths early.`
      },
      {
        title: 'QBRs that Sell',
        badge: 'Playbooks',
        stat: 'Higher GRR without discounting',
        icon: 'loop',
        copy: () => `Outcome-first narratives turn reviews into expansion.`
      },
      {
        title: 'Circuit & Path Intelligence',
        badge: 'Insight',
        stat: 'Cuts repeat incidents across sites',
        icon: 'trophy',
        copy: () => `Explain brownouts and shared risk with graph evidence.`
      }
    ],
    cosell: [
      {
        title: 'Register & Run',
        badge: 'Velocity',
        stat: 'Time-to-close compresses with joint execution',
        icon: 'infinity',
        copy: () => `Deal-reg and shared pipeline views unify motions and timelines.`
      },
      {
        title: 'Preferred Procurement',
        badge: 'Marketplace',
        stat: 'Legal/vendor steps shorten materially',
        icon: 'rocket',
        copy: () => `Meet buyers on curated marketplaces to speed onboarding.`
      },
      {
        title: 'Outcome-Linked Demos',
        badge: 'Proof',
        stat: 'Win-rate rises in head-to-head cycles',
        icon: 'users-round',
        copy: () => `Show how telemetry maps to SLA and user outcomes.`
      }
    ]
  };

  // Persona-specific story overrides
  const personaStories = {
    advisor: {
      recurring: [
        { title: 'Referral That Compounds', badge: 'Advisor · MRR', stat: 'Advisors report steadier income streams via portal-tracked referrals', icon: 'trending-up', copy: () => 'Register qualified opportunities and participate in conversion and renewal payouts with clear attribution.' },
        { title: 'Lead with Business Outcomes', badge: 'Packaging', stat: 'Executive cycles shorten when value is framed around risk and revenue', icon: 'package', copy: () => 'Co-branded slides and ROI snippets tie visibility to churn reduction and margin protection.' },
        { title: 'Track to Close', badge: 'Visibility', stat: 'Fewer disputes and faster payout reconciliation', icon: 'eye', copy: () => 'Deal registration, status, and payout reconciliation in one portal.' }
      ],
      services: [
        { title: 'Advisor Kit, Ready to Go', badge: 'Enablement', stat: 'Higher first-meeting → proposal conversions', icon: 'briefcase', copy: () => 'Discovery prompts, light demo script, and qualification checklist let you open doors without delivery overhead.' },
        { title: 'Seamless to Delivery', badge: 'Hand-Off', stat: 'No bench burden while keeping relationship capital', icon: 'handshake', copy: () => 'WanAware handles onboarding and operations; you remain the trusted guide.' },
        { title: 'Announce the Offer', badge: 'Co-Brand', stat: 'Faster launch with consistent messaging', icon: 'megaphone', copy: () => 'One-pagers and campaign copy co-market advisory-led visibility with partners.' }
      ],
      retention: [
        { title: 'Tell the Business Story', badge: 'Executive', stat: 'Earlier sponsor alignment in renewal cycles', icon: 'presentation', copy: () => 'Link uptime, user experience, and risk to KPIs that justify renewals.' },
        { title: 'QBR That Lands', badge: 'Evidence', stat: 'Cleaner renewal conversations; less friction', icon: 'file-check', copy: () => 'Compliance-ready summaries and service-health screenshots pulled from live dashboards.' },
        { title: 'Expose Blind Spots', badge: 'Insight', stat: 'Fewer "surprise" outages in key accounts', icon: 'alert-triangle', copy: () => 'Surface shared-risk circuits and dependencies before they erode trust.' }
      ],
      cosell: [
        { title: 'Protect the Opportunity', badge: 'Registration', stat: 'Ownership clarity reduces channel friction', icon: 'shield-check', copy: () => 'Register in minutes; field teams align on resources and next steps.' },
        { title: 'Outcome-First Demos', badge: 'Proof', stat: 'Greater multi-threading across the buying group', icon: 'users', copy: () => 'Walk buyers through what changes Monday for their team with less sprawl, more results.' },
        { title: 'Meet Buyers Where They Are', badge: 'Routes', stat: 'Reduced legal/vendor lead time', icon: 'map-pin', copy: () => 'Distributor and marketplace routes compress procurement and onboarding.' }
      ]
    },
    msp: {
      recurring: [
        { title: 'Package Managed Visibility', badge: 'MSP · MRR', stat: 'Partners lift MRR when visibility is attached to every contract', icon: 'package', copy: () => 'Tiered bundles with SLA-backed reporting and proactive incident workflows.' },
        { title: 'Close the Ticket Loop', badge: 'Automation', stat: 'Manual tickets per client drop with API automation', icon: 'repeat', copy: () => 'Open, enrich, and resolve via ITSM API to cut manual load and MTTR.' },
        { title: 'Your Brand, Our Engine', badge: 'White-Label', stat: 'Upsell close improves when value is shown monthly', icon: 'tag', copy: () => 'Branded dashboards and reports keep value visible in each QBR.' }
      ],
      services: [
        { title: 'From Runbook to SKU', badge: 'Blueprints', stat: 'Launch managed visibility offers in days, not weeks', icon: 'book-open', copy: () => 'Deployment scripts and starter runbooks accelerate productization.' },
        { title: 'Executive-Ready Reports', badge: 'SLA', stat: 'QBR preparation becomes repeatable and fast', icon: 'file-text', copy: () => 'Prebuilt SLA widgets and summaries reduce prep time for CSMs.' },
        { title: 'Launch with Air Cover', badge: 'Co-Marketing', stat: 'More partner-sourced opportunities per rep', icon: 'megaphone', copy: () => 'Case studies, pricing cards, and campaigns to seed pipeline.' }
      ],
      retention: [
        { title: 'Make Service Health Obvious', badge: 'Health', stat: 'Fewer renewal surprises; stronger narratives', icon: 'activity', copy: () => 'Dashboards surface risk and dependency paths early.' },
        { title: 'QBRs that Sell', badge: 'Playbooks', stat: 'Higher GRR without discounting', icon: 'book', copy: () => 'Outcome-first narratives turn reviews into expansion.' },
        { title: 'Circuit & Path Intelligence', badge: 'Insight', stat: 'Cuts repeat incidents across sites', icon: 'git-branch', copy: () => 'Explain brownouts and shared risk with graph evidence.' }
      ],
      cosell: [
        { title: 'Register & Run', badge: 'Velocity', stat: 'Time-to-close compresses with joint execution', icon: 'zap', copy: () => 'Deal-reg and shared pipeline views unify motions and timelines.' },
        { title: 'Preferred Procurement', badge: 'Marketplace', stat: 'Legal/vendor steps shorten materially', icon: 'shopping-cart', copy: () => 'Meet buyers on curated marketplaces to speed onboarding.' },
        { title: 'Outcome-Linked Demos', badge: 'Proof', stat: 'Win-rate rises in head-to-head cycles', icon: 'target', copy: () => 'Show how telemetry maps to SLA and user outcomes.' }
      ]
    },
    distributor: {
      recurring: [
        { title: 'Ecosystem MRR Engine', badge: 'Scale', stat: 'Volume programs align incentives across regions', icon: 'layers', copy: () => 'Downstream partners sell recurring visibility bundles; you orchestrate tiers and rebates.' },
        { title: 'Multi-Tenant Control', badge: 'Ops', stat: 'Lower support cost per partner', icon: 'server', copy: () => 'Provision, theme, and monitor sub-accounts centrally with margin tracking.' },
        { title: 'Analytics Add-Ons', badge: 'Telemetry', stat: 'New revenue line items for ecosystems', icon: 'bar-chart', copy: () => 'Package premium telemetry insights as reseller-ready SKUs.' }
      ],
      services: [
        { title: 'One-Click Partner Launch', badge: 'Onboarding', stat: 'Faster time-to-first-revenue for resellers', icon: 'play-circle', copy: () => 'Automated provisioning and templated enablement at scale.' },
        { title: 'White-Label at Scale', badge: 'Branding', stat: 'Consistent customer experience across territories', icon: 'palette', copy: () => 'Push themes and assets across all child portals.' },
        { title: 'Replicable Campaigns', badge: 'Growth', stat: 'Higher productivity across the network', icon: 'copy', copy: () => 'Turn winning plays into packaged motions partners can run.' }
      ],
      retention: [
        { title: 'Raise the Win-Rate', badge: 'Quality', stat: 'Fewer stalled deals; better forecast hygiene', icon: 'trending-up', copy: () => 'Proof kits and outcome templates standardize excellence.' },
        { title: 'Shared Health Dashboards', badge: 'Visibility', stat: 'Proactive save motions improve GRR', icon: 'eye', copy: () => 'Spot partner and client risks early and intervene.' },
        { title: 'Enablement Bench', badge: 'Bench', stat: 'Lower enablement cost per partner', icon: 'users', copy: () => 'Self-serve academy and playbooks keep skills repeatable.' }
      ],
      cosell: [
        { title: 'Territory Amplification', badge: 'Coverage', stat: 'Bigger roofs; expanded buying groups', icon: 'map', copy: () => 'Align our field with your network for larger rooms.' },
        { title: 'Tiered Benefits', badge: 'Programs', stat: 'Healthy competition within the ecosystem', icon: 'award', copy: () => 'Clear steps to margin upgrades and MDF access.' },
        { title: 'Rapid Proof Kits', badge: 'Proof', stat: 'Consistent execution out-of-the-box', icon: 'package', copy: () => 'Portable demo and ROI flows for any region.' }
      ]
    },
    si: {
      recurring: [
        { title: 'Attach Managed Visibility', badge: 'Services', stat: 'Stabilizes post-go-live outcomes', icon: 'link', copy: () => 'Create a recurring post-project stream alongside transformation work.' },
        { title: 'Monetize Integration IP', badge: 'IP', stat: 'Better utilization of bench time', icon: 'code', copy: () => 'Package connectors and dashboards as SKUs for reuse.' },
        { title: 'Outcome SLAs', badge: 'Assurance', stat: 'Shorter dispute cycles with evidence', icon: 'check-circle', copy: () => 'Tie app KPIs to telemetry for measurable guarantees.' }
      ],
      services: [
        { title: 'De-Risk Cutovers', badge: 'Speed', stat: 'Fewer rollbacks during migration windows', icon: 'shield', copy: () => 'Topology discovery and dependency maps reduce guesswork.' },
        { title: 'Evidence on Day One', badge: 'Compliance', stat: 'Audit prep time slashed', icon: 'file-check', copy: () => 'SOC 2 / ISO templates populated from live data.' },
        { title: 'Graph & API-First', badge: 'Extensibility', stat: 'Faster integration, clearer decisions', icon: 'git-branch', copy: () => 'Neo4j + GraphQL model plugs into your patterns cleanly.' }
      ],
      retention: [
        { title: 'Stay Beyond Go-Live', badge: 'Lifecycle', stat: 'Higher follow-on project rates', icon: 'repeat', copy: () => 'Transition to a managed visibility service smoothly.' },
        { title: 'Executive-Ready Roll-Ups', badge: 'Insights', stat: 'Momentum sustained through phases', icon: 'presentation', copy: () => 'Sponsor-level summaries keep programs aligned.' },
        { title: 'Dependency Risk Radar', badge: 'Risk', stat: 'Better change-control outcomes', icon: 'alert-triangle', copy: () => 'Show blast radius, supplier and circuit risks proactively.' }
      ],
      cosell: [
        { title: 'Executive-Level Motions', badge: 'Alignment', stat: 'Less tool talk; faster approvals', icon: 'briefcase', copy: () => 'Joint briefings map telemetry to KPIs and budgets.' },
        { title: 'Integration Accelerators', badge: 'Tooling', stat: 'Higher reuse across engagements', icon: 'tool', copy: () => 'Repeatable connectors for your target stack.' },
        { title: 'Regional Playbooks', badge: 'Scale', stat: 'Confidence in larger programs', icon: 'globe', copy: () => 'Template pursuit plans by industry and region.' }
      ]
    }
  };

  // ============================================
  // EDIT SECTION 5: CTA BUTTONS (Stage 4)
  // ============================================
  // These are the call-to-action buttons that appear at the end.
  // Each persona + goal combination has:
  //   - headline: Main CTA section title
  //   - subhead: Description text
  //   - primary: Main CTA button (label, url, id)
  //   - secondary: 2 additional CTA buttons
  // Edit: All text, button labels, and URLs for each scenario.
  // ============================================
  const BOOK_MEETING_LINK = 'https://calendly.com/james-king-wanaware/30min';
  const BECOME_PARTNER_LINK = 'https://wanaware.channeltivity.com/BecomeAPartner';

  const ctaMatrix = {
    msp: {
      recurring: {
        headline: 'Spin up your recurring revenue cockpit',
        subhead: 'Bring your service catalog and we’ll co-build pricing, packaging, and automation sequences.',
        primary: { label: 'Book the Revenue Lab', url: '#', id: 'book_revenue_lab' },
        secondary: [
          { label: 'Download recurring playbook', url: '#', id: 'download_playbook' },
          { label: 'Meet partner strategist', url: '#', id: 'schedule_partner_strategist' }
        ]
      },
      services: {
        headline: 'Launch services with confidence',
        subhead: 'We’ll blueprint the offer, deployment, and enablement path with your delivery leaders.',
        primary: { label: 'Schedule a Launch Blueprint', url: '#', id: 'schedule_launch_blueprint' },
        secondary: [
          { label: 'Preview deployment kit', url: '#', id: 'preview_deployment_kit' },
          { label: 'Join service design workshop', url: '#', id: 'join_design_workshop' }
        ]
      },
      retention: {
        headline: 'Build your retention command center',
        subhead: 'Instrument health scoring, lifecycle programs, and advocacy tracks in one motion.',
        primary: { label: 'Book Retention Studio', url: '#', id: 'book_retention_studio' },
        secondary: [
          { label: 'Access lifecycle dashboard', url: '#', id: 'access_lifecycle_dashboard' },
          { label: 'Talk to success architect', url: '#', id: 'talk_success_architect' }
        ]
      },
      cosell: {
        headline: 'Accelerate your co-sell flywheel',
        subhead: 'Bring your marketplace strategy and we’ll align offers, pipeline, and activation.',
        primary: { label: 'Book a Co-Sell Lab', url: '#', id: 'book_cosell_lab' },
        secondary: [
          { label: 'View marketplace kit', url: '#', id: 'view_marketplace_kit' },
          { label: 'Plan field activation', url: '#', id: 'plan_field_activation' }
        ]
      }
    },
    advisor: {
      recurring: {
        headline: 'Start earning recurring payouts',
        subhead: 'Register referrals and track conversions through your advisor portal.',
        primary: { label: 'Register a Referral', url: '#deal-registration', id: 'register_referral' },
        secondary: [
          { label: 'Download Advisor Kit', url: '#advisor-kit', id: 'download_advisor_kit' }
        ]
      },
      services: {
        headline: 'Enable your advisory practice',
        subhead: 'Get discovery prompts, demo scripts, and qualification tools to open doors.',
        primary: { label: 'Download Advisor Kit', url: '#advisor-kit', id: 'download_advisor_kit' },
        secondary: [
          { label: 'Register a Referral', url: '#deal-registration', id: 'register_referral' }
        ]
      },
      retention: {
        headline: 'Protect your recurring commissions',
        subhead: 'Track referred client success and access renewal resources to maintain your payout stream.',
        primary: { label: 'Download Advisor Kit', url: '#advisor-kit', id: 'download_advisor_kit' },
        secondary: [
          { label: 'Register a Referral', url: '#deal-registration', id: 'register_referral' }
        ]
      },
      cosell: {
        headline: 'Protect your opportunities',
        subhead: 'Register deals early and leverage marketplace routes for faster procurement.',
        primary: { label: 'Register a Referral', url: '#deal-registration', id: 'register_referral' },
        secondary: [
          { label: 'Download Advisor Kit', url: '#advisor-kit', id: 'download_advisor_kit' }
        ]
      }
    },
    distributor: {
      recurring: {
        headline: 'Mobilize partners for predictable revenue',
        subhead: 'We’ll outfit your catalog with pricing, collateral, and incentive tracks so the ecosystem can sell subscriptions faster.',
        primary: { label: 'Launch partner revenue hub', url: '#', id: 'launch_partner_revenue_hub' },
        secondary: [
          { label: 'Request incentive catalogue', url: '#', id: 'request_incentive_catalogue' },
          { label: 'Book enablement studio', url: '#', id: 'book_enablement_studio' }
        ]
      },
      services: {
        headline: 'Productize services across your network',
        subhead: 'Distribute turnkey offers and playbooks to your partner ecosystem.',
        primary: { label: 'Deploy service factory', url: '#', id: 'deploy_service_factory' },
        secondary: [
          { label: 'Get partner launch kit', url: '#', id: 'get_partner_launch_kit' },
          { label: 'Schedule ecosystem lab', url: '#', id: 'schedule_ecosystem_lab' }
        ]
      },
      retention: {
        headline: 'Drive retention at scale',
        subhead: 'Operationalize lifecycle campaigns and reporting that partners can adopt instantly.',
        primary: { label: 'Spin up retention workspace', url: '#', id: 'spin_up_retention_workspace' },
        secondary: [
          { label: 'Download success playbook', url: '#', id: 'download_success_playbook' },
          { label: 'Train partner success teams', url: '#', id: 'train_partner_success' }
        ]
      },
      cosell: {
        headline: 'Power co-sell marketplaces',
        subhead: 'Coordinate listings, incentives, and activation sequences for every territory.',
        primary: { label: 'Launch marketplace accelerator', url: '#', id: 'launch_marketplace_accelerator' },
        secondary: [
          { label: 'View co-sell calendar', url: '#', id: 'view_cosell_calendar' },
          { label: 'Share pipeline telemetry', url: '#', id: 'share_pipeline_telemetry' }
        ]
      }
    },
    si: {
      recurring: {
        headline: 'Anchor recurring value in transformation deals',
        subhead: 'Bundle managed services into enterprise programs with executive-ready proof.',
        primary: { label: 'Design enterprise revenue bundle', url: '#', id: 'design_enterprise_bundle' },
        secondary: [
          { label: 'Access transformation metrics', url: '#', id: 'access_transformation_metrics' },
          { label: 'Book value engineering session', url: '#', id: 'book_value_engineering' }
        ]
      },
      services: {
        headline: 'Accelerate complex service launches',
        subhead: 'Align delivery, governance, and change management under one playbook.',
        primary: { label: 'Architect service portfolio', url: '#', id: 'architect_service_portfolio' },
        secondary: [
          { label: 'Review governance model', url: '#', id: 'review_governance_model' },
          { label: 'Plan change management kit', url: '#', id: 'plan_change_management' }
        ]
      },
      retention: {
        headline: 'Prove value across the lifecycle',
        subhead: 'Combine telemetry, executive health reviews, and success stories to secure renewals.',
        primary: { label: 'Launch lifecycle intelligence', url: '#', id: 'launch_lifecycle_intelligence' },
        secondary: [
          { label: 'Download executive scorecard', url: '#', id: 'download_executive_scorecard' },
          { label: 'Meet customer success leader', url: '#', id: 'meet_success_leader' }
        ]
      },
      cosell: {
        headline: 'Unify co-sell for enterprise programs',
        subhead: 'Coordinate GTM, delivery, and success teams with shared telemetry for every alliance.',
        primary: { label: 'Orchestrate alliance lab', url: '#', id: 'orchestrate_alliance_lab' },
        secondary: [
          { label: 'Access joint governance plan', url: '#', id: 'access_joint_governance' },
          { label: 'Schedule exec alignment', url: '#', id: 'schedule_exec_alignment' }
        ]
      }
    }
  };

  const elements = {
    heroSummary: document.getElementById('mission-summary'),
    telemetry: document.getElementById('telemetry-log'),
    personaReadout: document.getElementById('persona-readout'),
    personaSubtext: document.getElementById('persona-subtext'),
    personaSignal: document.getElementById('persona-signal'),
    goalIntro: document.getElementById('goal-intro'),
    consoleReadout: document.getElementById('console-readout'),
    consoleSubtext: document.getElementById('console-subtext'),
    goalSignal: document.getElementById('goal-signal'),
    priorityLabel: document.getElementById('priority-label'),
    readinessIntro: document.getElementById('readiness-intro'),
    readinessChecklist: document.getElementById('readiness-checklist'),
    storyCards: document.getElementById('story-cards'),
    ctaHeadline: document.getElementById('cta-headline'),
    ctaSubhead: document.getElementById('cta-subhead'),
    ctaGrid: document.getElementById('cta-grid'),
    ctaFootnote: document.getElementById('cta-footnote')
  };

  // Rewards dock elements
  const rewardsDock = document.querySelector('.rewards-dock');
  const rewardItems = Array.from(document.querySelectorAll('.reward-item'));

  // PDF URLs for downloads (all map to persona-specific PDFs)
  const pdfUrls = {
    'msp': 'https://46424092.fs1.hubspotusercontent-na2.net/hubfs/46424092/For%20MSPs%20%20MSSPs%20(Managed%20Service%20&%20Managed%20Security%20Service%20Providers).pdf',
    'distributor': 'https://46424092.fs1.hubspotusercontent-na2.net/hubfs/46424092/For%20Distributors.pdf',
    'si': 'https://46424092.fs1.hubspotusercontent-na2.net/hubfs/46424092/For%20Systems%20Integrators%20(Channel%20Partners).pdf',
    'advisor': 'https://46424092.fs1.hubspotusercontent-na2.net/hubfs/46424092/For%20Value-Added%20Resellers%20(VARs).pdf'
  };

  // Reward overlay elements
  const rewardOverlay = document.getElementById('reward-overlay');
  const rewardTitle = document.getElementById('reward-title');
  const rewardDescription = document.getElementById('reward-description');
  const rewardPrimary = document.getElementById('reward-primary');
  const rewardPrimaryLabel = document.getElementById('reward-primary-label');
  const rewardDismiss = document.getElementById('reward-dismiss');
  let lastUnlockedRewardButton = null;

  const rewardCopy = [
    {
      title: 'Persona intel unlocked',
      description: 'You have locked in who you are as a partner. Download the one-pager tuned to this role.',
      cta: 'Download persona guide'
    },
    {
      title: 'Objective playbook unlocked',
      description: 'You have chosen your growth objective. Grab the playbook that matches your selections.',
      cta: 'Download objective playbook'
    },
    {
      title: 'Mission playbook unlocked',
      description: 'You have cleared readiness. Download the full guide for this mission path.',
      cta: 'Download mission playbook'
    }
  ];

  function normalizeAcronymLabels() {
    const replacements = [
      { selector: '.msp-offer-chip[data-offer="NOC"]', label: 'Network operations center services' },
      { selector: '.msp-offer-chip[data-offer="SD-WAN"]', label: 'Software-defined wide-area networking' },
      { selector: '.msp-offer-chip[data-offer="SASE/SSE"]', label: 'Secure access service edge / security service edge' },
      { selector: '.msp-offer-chip[data-offer="Cloud Networking"]', label: 'Cloud networking for sites, branches, and cloud' },
      { selector: '.si-focus-chip[data-focus="SD-WAN"]', label: 'Software-defined wide-area networking' },
      { selector: '.si-focus-chip[data-focus="SASE/SSE"]', label: 'Secure access service edge / security service edge' },
      { selector: '.si-focus-chip[data-focus="Cloud Networking"]', label: 'Cloud networking for sites, branches, and cloud' },
      { selector: '.advisor-focus-chip[data-focus="SD-WAN Selection"]', label: 'Software-defined wide-area networking selection' },
      { selector: '.advisor-focus-chip[data-focus="SASE/SSE Selection"]', label: 'Secure access service edge / security service edge selection' },
      { selector: '.dist-focus-chip[data-focus="SD-WAN/SASE"]', label: 'Software-defined wide-area networking / secure access service edge' }
    ];

    replacements.forEach(({ selector, label }) => {
      document.querySelectorAll(selector).forEach(el => {
        el.textContent = label;
      });
    });
  }

  // Warp overlay element
  const warpOverlay = document.getElementById('warp-overlay');

  // Email overlay elements
  const emailOverlay = document.getElementById('email-overlay');
  const firstnameInput = document.getElementById('firstname-input');
  const lastnameInput = document.getElementById('lastname-input');
  const emailInput = document.getElementById('email-input');
  const businessNameInput = document.getElementById('business-name-input');
  const businessWebsiteInput = document.getElementById('business-website-input');
  const emailConfirm = document.getElementById('email-confirm');
  const emailCancel = document.getElementById('email-cancel');
  const emailError = document.getElementById('email-error');

  // Trigger warp speed effect
  function triggerWarpEffect() {
    if (!warpOverlay) return;
    warpOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      warpOverlay.setAttribute('aria-hidden', 'true');
    }, 600);
  }

  // Countdown timer for readiness stage
  function initCountdownTimer() {
    const countdownEl = document.getElementById('launch-countdown');
    if (!countdownEl) return;

    // Set target to 24 hours from now
    const endTime = Date.now() + (24 * 60 * 60 * 1000);
    
    function updateCountdown() {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        countdownEl.textContent = 'Launch window expired';
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      countdownEl.textContent = `Launch window closing in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // Personalized insights data
  const personaInsights = {
    'msp': '87% of MSPs prioritize recurring revenue growth as their primary objective',
    'distributor': '73% of distributors focus on expanding their active reseller network',
    'si': '91% of system integrators target enterprise accounts for strategic projects',
    'advisor': '82% of technology advisors emphasize building trusted advisor relationships'
  };

  const goalInsights = {
    'recurring_revenue': 'Partners like you typically see 40% faster time-to-revenue with structured onboarding',
    'pipeline_velocity': 'This goal is chosen by 65% of high-growth partners in your segment',
    'customer_retention': 'Partners focusing on retention report 2.3x higher customer lifetime value',
    'market_expansion': '78% of partners pursuing expansion prioritize geographic diversification first'
  };

  // Show personalized insight
  function showPersonaInsight(persona) {
    const insightContainer = document.getElementById('persona-insight');
    const insightText = document.getElementById('persona-insight-text');
    if (!insightContainer || !insightText || !persona) return;

    const insight = personaInsights[persona];
    if (insight) {
      insightText.textContent = insight;
      insightContainer.classList.remove('hidden');
      refreshIcons();
    }
  }

  function showGoalInsight(goal) {
    const insightContainer = document.getElementById('goal-insight');
    const insightText = document.getElementById('goal-insight-text');
    if (!insightContainer || !insightText || !goal) return;

    const insight = goalInsights[goal];
    if (insight) {
      insightText.textContent = insight;
      insightContainer.classList.remove('hidden');
      refreshIcons();
    }
  }

  // Rocket click easter egg
  function initRocketEasterEgg() {
    const rocketContainer = document.querySelector('.rocket-container');
    if (!rocketContainer) return;

    let clickCount = 0;
    let resetTimer = null;

    rocketContainer.addEventListener('click', () => {
      clickCount++;
      
      // Reset counter after 2 seconds of no clicks
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        clickCount = 0;
      }, 2000);

      // Trigger easter egg on 5th click
      if (clickCount === 5) {
        clickCount = 0;
        triggerRocketEasterEgg(rocketContainer);
      }
    });
  }

  function triggerRocketEasterEgg(rocket) {
    // Add special animation class
    rocket.style.animation = 'rocket-blast 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    // Update telemetry with fun message
    updateTelemetry('🚀 EASTER EGG ACTIVATED: Rocket boosters engaged!');
    
    // Record easter egg discovery
    recordEvent('easter_egg_discovered', { type: 'rocket_clicks' });

    // Reset animation after completion
    setTimeout(() => {
      rocket.style.animation = '';
    }, 1500);
  }

  // MSP detail panel elements
  const mspPanel = document.getElementById('msp-detail-panel');
  const changePersonaBtns = Array.from(document.querySelectorAll('.change-persona-btn, #change-persona-btn'));
  const mspOfferChips = Array.from(document.querySelectorAll('.msp-offer-chip'));
  const mspSizeBtns = Array.from(document.querySelectorAll('.msp-size-btn'));
  const mspRegionChips = Array.from(document.querySelectorAll('.msp-region-chip'));
  const mspWhiteBtns = Array.from(document.querySelectorAll('.msp-whitelabel-btn'));
  const advisorFocusChips = Array.from(document.querySelectorAll('.advisor-focus-chip'));
  const advisorSizeBtns = Array.from(document.querySelectorAll('.advisor-size-btn'));
  const advisorRegionChips = Array.from(document.querySelectorAll('.advisor-region-chip'));
  const advisorCobrandBtns = Array.from(document.querySelectorAll('.advisor-cobrand-btn'));
  const advisorConfirm = document.getElementById('advisor-confirm');
  // SI selectors
  const siFocusChips = Array.from(document.querySelectorAll('.si-focus-chip'));
  const siLengthBtns = Array.from(document.querySelectorAll('.si-length-btn'));
  const siVerticalChips = Array.from(document.querySelectorAll('.si-vertical-chip'));
  const siRegionChips = Array.from(document.querySelectorAll('.si-region-chip'));
  const siProcureBtns = Array.from(document.querySelectorAll('.si-procure-btn'));
  const siConfirm = document.getElementById('si-confirm');
  // Distributor selectors
  const distFocusChips = Array.from(document.querySelectorAll('.dist-focus-chip'));
  const distBandBtns = Array.from(document.querySelectorAll('.dist-band-btn'));
  const distRegionChips = Array.from(document.querySelectorAll('.dist-region-chip'));
  const distDealregBtns = Array.from(document.querySelectorAll('.dist-dealreg-btn'));
  const distMdfBtns = Array.from(document.querySelectorAll('.dist-mdf-btn'));
  const distributorConfirm = document.getElementById('distributor-confirm');
  const personaLayout = document.getElementById('persona-layout');
  const personaGrid = document.getElementById('persona-grid');
  const mspConfirm = document.getElementById('msp-confirm');
  const trajectoryControls = document.querySelector('#mission-goal #trajectory-controls');
  const ttsBtns = Array.from(document.querySelectorAll('#mission-goal .timeline-point[data-traj="time_to_start"]'));
  const ownerBtns = Array.from(document.querySelectorAll('#mission-goal .traj-btn[data-traj="process_owner"]'));
  const bandBtns = Array.from(document.querySelectorAll('#mission-goal .traj-btn[data-traj="customer_band"]'));
  const introBtns = Array.from(document.querySelectorAll('#mission-goal .traj-btn[data-traj="intro_accounts_30d"]'));
  const ownerAvatars = Array.from(document.querySelectorAll('#mission-goal .traj-avatar[data-traj="process_owner"]'));

  // Interactive hero spotlight over the rocket
  function initHeroSpotlight() {
    const hero = document.getElementById('mission-hero');
    const rocket = hero ? hero.querySelector('.rocket-container') : null;
    const spot = rocket ? rocket.querySelector('.rocket-spotlight') : null;
    if (!hero || !rocket || !spot) return;

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let pointerActive = false;
    let idleTimer = null;
    let rafId = 0;
    let t = Math.random() * Math.PI * 2;

    function setPos(x, y) {
      rocket.style.setProperty('--sx', x + 'px');
      rocket.style.setProperty('--sy', y + 'px');
    }

    function getCenter() {
      const r = rocket.getBoundingClientRect();
      return { x: r.width / 2, y: r.height / 2 };
    }

    function onMove(e) {
      const r = rocket.getBoundingClientRect();
      const p = (e.touches && e.touches[0]) || e;
      const x = Math.max(0, Math.min(r.width, p.clientX - r.left));
      const y = Math.max(0, Math.min(r.height, p.clientY - r.top));
      setPos(x, y);
      pointerActive = true;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { pointerActive = false; }, 1600);
    }

    function drift() {
      if (reduceMotion) return;
      const r = rocket.getBoundingClientRect();
      if (!pointerActive) {
        t += 0.015;
        const x = r.width / 2 + Math.cos(t) * r.width * 0.18;
        const y = r.height / 2 + Math.sin(t * 1.3) * r.height * 0.14;
        setPos(x, y);
      }
      rafId = requestAnimationFrame(drift);
    }

    let running = false;
    function start() {
      if (running || reduceMotion) return;
      running = true;
      rafId = requestAnimationFrame(drift);
    }
    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
    }

    // Initialize at center
    const c = getCenter();
    setPos(c.x, c.y);

    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('touchmove', onMove, { passive: true });
    hero.addEventListener('mouseleave', () => { pointerActive = false; });

    const visObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) start(); else stop();
      });
    }, { threshold: 0.2 });
    visObs.observe(hero);

    // Clean up if needed (not strictly necessary on this page)
    window.addEventListener('beforeunload', () => cancelAnimationFrame(rafId));
  }

  const hiddenFields = {
    firstname: document.querySelector('input[name="journey_first_name"]'),
    lastname: document.querySelector('input[name="journey_last_name"]'),
    email: document.querySelector('input[name="journey_email"]'),
    business_name: document.querySelector('input[name="journey_business_name"]'),
    business_website: document.querySelector('input[name="journey_business_website"]'),
    msp_offers: document.querySelector('input[name="journey_msp_offers"]'),
    advisor_focus: document.querySelector('input[name="journey_advisor_focus"]'),
    target_customer_size: document.querySelector('input[name="journey_target_customer_size"]'),
    regions_served: document.querySelector('input[name="journey_regions_served"]'),
    white_label_required: document.querySelector('input[name="journey_white_label_required"]'),
    cobrand_required: document.querySelector('input[name="journey_cobrand_required"]'),
    // SI hidden fields
    si_focus: document.querySelector('input[name="journey_si_focus"]'),
    project_length_band: document.querySelector('input[name="journey_project_length_band"]'),
    verticals: document.querySelector('input[name="journey_verticals"]'),
    si_procurement_model: document.querySelector('input[name="journey_si_procurement_model"]'),
    // Distributor hidden fields
    distributor_focus: document.querySelector('input[name="journey_distributor_focus"]'),
    active_reseller_band: document.querySelector('input[name="journey_active_reseller_band"]'),
    deal_reg_price_protect: document.querySelector('input[name="journey_deal_reg_price_protect"]'),
    mdf_available: document.querySelector('input[name="journey_mdf_available"]'),
    var_activation_motion: document.querySelector('input[name="journey_var_activation_motion"]'),
    intro_vars_30d: document.querySelector('input[name="journey_intro_vars_30d"]'),
    marketplaces: document.querySelector('input[name="journey_marketplaces"]'),
    program_levers: document.querySelector('input[name="journey_program_levers"]'),
    enablement_plan: document.querySelector('input[name="journey_enablement_plan"]'),
    var_enablement_path: document.querySelector('input[name="journey_var_enablement_path"]'),
    bundle_sku_ready: document.querySelector('input[name="journey_bundle_sku_ready"]'),
    time_to_start: document.querySelector('input[name="journey_time_to_start"]'),
    process_owner: document.querySelector('input[name="journey_process_owner"]'),
    customer_band: document.querySelector('input[name="journey_active_customer_band"]'),
    intro_accounts_30d: document.querySelector('input[name="journey_intro_accounts_30d"]'),
    kickoff_window: document.querySelector('input[name="journey_pilot_kickoff_window"]'),
    exec_sponsor_named: document.querySelector('input[name="journey_exec_sponsor_named"]'),
    weekly_time_commitment: document.querySelector('input[name="journey_weekly_time_commitment"]'),
    partner: document.querySelector('input[name="journey_partner_type"]'),
    goal: document.querySelector('input[name="journey_goal"]'),
    pain: document.querySelector('input[name="journey_pain_point"]'),
    priority: document.querySelector('input[name="journey_priority"]'),
    stage: document.querySelector('input[name="journey_completion_stage"]'),
    cta: document.querySelector('input[name="journey_cta_selected"]')
  };

  const missionForm = document.getElementById('journey-sync-form');
  const missionScroll = document.getElementById('mission-scroll');
  let snapRestoreTimer = null;

  // Submit hidden form to HubSpot (non-blocking)
  function submitToHubSpot() {
    if (!missionForm) return;
    try {
      // HubSpot Collected Forms will capture this submit event
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      missionForm.dispatchEvent(submitEvent);
    } catch (e) {
      console.warn('Form submit failed:', e);
    }
  }

  const personaButtons = Array.from(document.querySelectorAll('.persona-badge'));
  const goalButtons = Array.from(document.querySelectorAll('.goal-toggle'));
  const painButtons = Array.from(document.querySelectorAll('.pain-chip'));
  const progressDock = document.querySelector('.progress-dock');
  const missionGoalSection = document.getElementById('mission-goal');
  const changeGoalBtn = document.getElementById('change-goal-btn');
  const progressPills = Array.from(document.querySelectorAll('.progress-pill'));
  // Readiness selectors
  const kickoffChips = Array.from(document.querySelectorAll('#mission-readiness .ready-chip[data-ready="kickoff"]'));
  const execBtns = Array.from(document.querySelectorAll('#mission-readiness .ready-bool-btn[data-ready="exec"]'));
  const weeklyBtns = Array.from(document.querySelectorAll('#mission-readiness .ready-time-btn[data-ready="weekly"]'));

  const prioritySlider = document.getElementById('priority-slider');
  const beginMission = document.getElementById('begin-mission');
  const briefingAdvance = document.getElementById('briefing-advance');
  const readinessAdvance = document.getElementById('readiness-advance');
  const goalConfirm = document.getElementById('goal-confirm');

  function disableSnapTemporarily(duration = 800) {
    if (!missionScroll) return;
    missionScroll.classList.add('snapping-disabled');
    if (snapRestoreTimer) clearTimeout(snapRestoreTimer);
    snapRestoreTimer = setTimeout(() => {
      missionScroll.classList.remove('snapping-disabled');
    }, duration);
  }

  function scrollToStage(selector, smooth = true) {
    const el = document.querySelector(selector);
    if (!el) return;
    setTimeout(() => {
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    }, 180);
  }

  // Progressive reveal helpers
  function setRevealed(stageId, revealed = true) {
    const el = document.getElementById(stageId);
    if (el) {
      el.setAttribute('data-revealed', revealed ? 'true' : 'false');
      // Ensure CTAs are rendered when the CTA stage is revealed
      if (stageId === 'mission-cta' && revealed) {
        renderCtas();
      }
    }
  }

  // Backwards-compatible helper now that scroll is not locked
  function temporarilyUnlockAndScroll(selector) {
    disableSnapTemporarily();
    scrollToStage(selector);
  }

  // Preserve current scroll position through layout changes
  function withPreservedScroll(cb) {
    const y = window.scrollY;
    const active = document.activeElement;
    if (active && typeof active.blur === 'function') active.blur();

    // Lock scroll position during updates
    const scrollEl = document.getElementById('mission-scroll');
    const originalOverflow = scrollEl ? scrollEl.style.overflow : null;
    if (scrollEl) scrollEl.style.overflow = 'hidden';

    try { 
      cb && cb(); 
    } finally {
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: 'auto' });
        // Restore overflow after a brief delay
        setTimeout(() => {
          if (scrollEl && originalOverflow !== null) scrollEl.style.overflow = originalOverflow;
        }, 100);
      });
    }
  }

  // ===== SI: Stage 1 Handlers =====
  // Practice focus (multi)
  siFocusChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-focus');
      const arr = state.siFocus;
      const i = arr.indexOf(val);
      if (i === -1) arr.push(val); else arr.splice(i, 1);
      const on = i === -1;
      chip.setAttribute('data-active', on ? 'true' : 'false');
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      updateHidden('si_focus', (arr || []).join('; '));
      recordEvent('si_focus_toggle', { value: val, on });
      const row = document.querySelector('.ready-system-row[data-system="si-focus"]');
      if (row) row.setAttribute('data-complete', arr.length ? 'true' : 'false');
      updateSiConfirmState();
    });
  });

  // Project length (single)
  siLengthBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.projectLengthBand = btn.getAttribute('data-band') || '';
      siLengthBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('project_length_band', state.projectLengthBand);
      recordEvent('project_length_band_set', { value: state.projectLengthBand });
      const row = document.querySelector('.ready-system-row[data-system="si-length"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateSiConfirmState();
    });
  });

  // Verticals (multi)
  siVerticalChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-vertical');
      const idx = state.verticals.indexOf(val);
      const on = idx === -1;
      if (on) state.verticals.push(val); else state.verticals.splice(idx, 1);
      chip.setAttribute('data-active', on ? 'true' : 'false');
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      updateHidden('verticals', (state.verticals || []).join('; '));
      recordEvent('vertical_toggle', { value: val, on });
      const row = document.querySelector('.ready-system-row[data-system="si-verticals"]');
      if (row) row.setAttribute('data-complete', state.verticals.length ? 'true' : 'false');
      updateSiConfirmState();
    });
  });

  // Regions (multi) — reuse global regionsServed
  siRegionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-region');
      const idx = state.regionsServed.indexOf(val);
      const on = idx === -1;
      if (on) state.regionsServed.push(val); else state.regionsServed.splice(idx, 1);
      chip.setAttribute('data-active', on ? 'true' : 'false');
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      updateHidden('regions_served', (state.regionsServed || []).join('; '));
      recordEvent('regions_toggle', { value: val, on });
      const row = document.querySelector('.ready-system-row[data-system="si-regions"]');
      if (row) row.setAttribute('data-complete', state.regionsServed.length ? 'true' : 'false');
      updateSiConfirmState();
    });
  });

  // Procurement model (optional single)
  siProcureBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.siProcurementModel = btn.getAttribute('data-val') || '';
      siProcureBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('si_procurement_model', state.siProcurementModel);
      recordEvent('si_procurement_model_set', { value: state.siProcurementModel });
    });
  });

  function updateSiConfirmState() {
    const f = (state.siFocus || []).length > 0;
    const l = Boolean(state.projectLengthBand);
    const r = (state.regionsServed || []).length > 0;
    setButtonState(siConfirm, f && l && r);
  }

  siConfirm?.addEventListener('click', () => {
    recordEvent('si_stage1_confirmed');
    unlockStage(3);
    setCurrentStage('mission-goal');
    setRevealed('mission-goal', true);
    temporarilyUnlockAndScroll('#mission-goal');
  });

  // Distributor: line-card focus (multi)
  distFocusChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-focus');
      const arr = state.distributorFocus;
      const i = arr.indexOf(val);
      if (i === -1) arr.push(val); else arr.splice(i, 1);
      chip.setAttribute('data-active', i === -1 ? 'true' : 'false');
      chip.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
      updateHidden('distributor_focus', (arr || []).join('; '));
      recordEvent('distributor_focus_toggle', { value: val, on: i === -1 });
      const row = document.querySelector('.ready-system-row[data-system="dist-focus"]');
      if (row) row.setAttribute('data-complete', arr.length ? 'true' : 'false');
      updateDistributorConfirmState();
    });
  });

  // Distributor: reseller band (single)
  distBandBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeResellerBand = btn.getAttribute('data-band') || '';
      distBandBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('active_reseller_band', state.activeResellerBand);
      recordEvent('active_reseller_band_set', { value: state.activeResellerBand });
      const row = document.querySelector('.ready-system-row[data-system="dist-band"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateDistributorConfirmState();
    });
  });

  // Distributor: regions (multi)
  distRegionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-region');
      const idx = state.regionsServed.indexOf(val);
      if (idx === -1) state.regionsServed.push(val); else state.regionsServed.splice(idx, 1);
      const on = idx === -1;
      chip.setAttribute('data-active', on ? 'true' : 'false');
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      updateHidden('regions_served', (state.regionsServed || []).join('; '));
      recordEvent('regions_toggle', { value: val, on });
      const row = document.querySelector('.ready-system-row[data-system="dist-regions"]');
      if (row) row.setAttribute('data-complete', state.regionsServed.length ? 'true' : 'false');
      updateDistributorConfirmState();
    });
  });

  // Distributor: deal-reg & price protection (boolean)
  distDealregBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-val') === 'Yes' ? 'true' : 'false';
      state.dealRegPriceProtect = v;
      distDealregBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('deal_reg_price_protect', v);
      recordEvent('deal_reg_price_protect_set', { value: v });
      const row = document.querySelector('.ready-system-row[data-system="dist-dealreg"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateDistributorConfirmState();
    });
  });

  // Distributor: MDF/co-marketing funds (boolean)
  distMdfBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-val') === 'Yes' ? 'true' : 'false';
      state.mdfAvailable = v;
      distMdfBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('mdf_available', v);
      recordEvent('mdf_available_set', { value: v });
      const row = document.querySelector('.ready-system-row[data-system="dist-mdf"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateDistributorConfirmState();
    });
  });

  function updateDistributorConfirmState() {
    const f = (state.distributorFocus || []).length > 0;
    const b = Boolean(state.activeResellerBand);
    const r = (state.regionsServed || []).length > 0;
    const d = state.dealRegPriceProtect === 'true' || state.dealRegPriceProtect === 'false';
    const m = state.mdfAvailable === 'true' || state.mdfAvailable === 'false';
    setButtonState(distributorConfirm, f && b && r && d && m);
  }

  distributorConfirm?.addEventListener('click', () => {
    recordEvent('distributor_stage1_confirmed');
    unlockStage(3);
    setCurrentStage('mission-goal');
    setRevealed('mission-goal', true);
    temporarilyUnlockAndScroll('#mission-goal');
  });

  changeGoalBtn?.addEventListener('click', () => {
    missionGoalSection?.setAttribute('data-goal-locked', 'false');
    changeGoalBtn?.classList.add('hidden');
  });

  // ===== Stage 2 Trajectory Handlers =====
  ttsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.timeToStart = btn.getAttribute('data-value') || '';
      ttsBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('time_to_start', state.timeToStart);
      recordEvent('time_to_start_set', { value: state.timeToStart });
      // Mark system row as complete
      const row = document.querySelector('.ready-system-row[data-system="traj-time"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateGoalConfirmState();
    });
  });

  ownerAvatars.forEach(btn => {
    btn.addEventListener('click', () => {
      state.processOwner = btn.getAttribute('data-value') || '';
      ownerAvatars.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('process_owner', state.processOwner);
      recordEvent('process_owner_set', { value: state.processOwner });
      // Mark system row as complete
      const row = document.querySelector('.ready-system-row[data-system="traj-owner"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateGoalConfirmState();
    });
  });

  bandBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeCustomerBand = btn.getAttribute('data-value') || '';
      bandBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('customer_band', state.activeCustomerBand);
      recordEvent('customer_band_set', { value: state.activeCustomerBand });
      const row = document.querySelector('.ready-system-row[data-system="traj-band"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateGoalConfirmState();
    });
  });

  introBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.introAccounts30d = btn.getAttribute('data-value') || '';
      introBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('intro_accounts_30d', state.introAccounts30d);
      recordEvent('intro_accounts_30d_selected', { value: state.introAccounts30d });
      const row = document.querySelector('.ready-system-row[data-system="traj-intros"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateGoalConfirmState();
    });
  });

  function updateGoalConfirmState() {
    const goalOk = Boolean(state.goal);
    const painOk = Boolean(state.pain);
    const ttsOk = Boolean(state.timeToStart);
    const ownerOk = Boolean(state.processOwner);
    const bandOk = Boolean(state.activeCustomerBand);
    const introOk = Boolean(state.introAccounts30d);
    setButtonState(goalConfirm, goalOk && painOk && ttsOk && ownerOk && bandOk && introOk);
  }

  function updateReadinessConfirmState() {
    const kOk = Boolean(state.kickoffWindow);
    const eOk = state.execSponsorNamed === 'true' || state.execSponsorNamed === 'false' || state.execSponsorNamed === 'Yes' || state.execSponsorNamed === 'No';
    const wOk = Boolean(state.weeklyTimeCommitment);
    setButtonState(readinessAdvance, kOk && eOk && wOk);
  }

  function renderReadiness() {
    // reflect current selections on UI
    kickoffChips.forEach(b => {
      const active = b.getAttribute('data-value') === state.kickoffWindow;
      b.setAttribute('data-active', active ? 'true' : 'false');
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    execBtns.forEach(b => {
      const val = b.getAttribute('data-value') || '';
      const canonical = val === 'Yes' ? 'true' : val === 'No' ? 'false' : val;
      const active = state.execSponsorNamed === canonical;
      b.setAttribute('data-active', active ? 'true' : 'false');
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    weeklyBtns.forEach(b => {
      const active = b.getAttribute('data-value') === state.weeklyTimeCommitment;
      b.setAttribute('data-active', active ? 'true' : 'false');
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Update system row complete states
    const kickoffRow = document.querySelector('.ready-system-row[data-system="kickoff"]');
    const execRow = document.querySelector('.ready-system-row[data-system="exec"]');
    const weeklyRow = document.querySelector('.ready-system-row[data-system="weekly"]');
    if (kickoffRow) kickoffRow.setAttribute('data-complete', state.kickoffWindow ? 'true' : 'false');
    if (execRow) execRow.setAttribute('data-complete', (state.execSponsorNamed === 'true' || state.execSponsorNamed === 'false') ? 'true' : 'false');
    if (weeklyRow) weeklyRow.setAttribute('data-complete', state.weeklyTimeCommitment ? 'true' : 'false');

    updateReadinessConfirmState();
  }

  // Readiness events
  kickoffChips.forEach(btn => {
    btn.addEventListener('click', () => {
      state.kickoffWindow = btn.getAttribute('data-value') || '';
      kickoffChips.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('kickoff_window', state.kickoffWindow);
      recordEvent('kickoff_window_selected', { value: state.kickoffWindow });
      // Mark system row as complete
      const row = document.querySelector('.ready-system-row[data-system="kickoff"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateReadinessConfirmState();
    });
  });

  execBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const raw = btn.getAttribute('data-value') || '';
      const v = raw === 'Yes' ? 'true' : raw === 'No' ? 'false' : raw;
      state.execSponsorNamed = v;
      execBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('exec_sponsor_named', state.execSponsorNamed);
      recordEvent('exec_sponsor_named_selected', { value: state.execSponsorNamed });
      // Mark system row as complete
      const row = document.querySelector('.ready-system-row[data-system="exec"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateReadinessConfirmState();
    });
  });

  weeklyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.weeklyTimeCommitment = btn.getAttribute('data-value') || '';
      weeklyBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('weekly_time_commitment', state.weeklyTimeCommitment);
      recordEvent('weekly_time_commitment_selected', { value: state.weeklyTimeCommitment });
      // Mark system row as complete
      const row = document.querySelector('.ready-system-row[data-system="weekly"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateReadinessConfirmState();
    });
  });


  function stageIndex(id) {
    return stageIds.indexOf(id);
  }

  function updateHiddenStage() {
    if (hiddenFields.stage) hiddenFields.stage.value = state.currentStage;
  }

  function updateProgressDock() {
    if (!progressDock) return;

    // Keep docks visible as soon as the hero is mostly out of view, even if the
    // current stage hasn't updated yet (e.g., when scrolling back down).
    const hero = document.getElementById('mission-hero');
    const heroHeight = hero ? hero.offsetHeight : 0;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const heroCleared = scrollTop > Math.max(140, heroHeight * 0.35);
    const shouldShow = state.currentStage !== 'mission-hero' || heroCleared;

    progressDock.setAttribute('data-visibility', shouldShow ? 'visible' : 'hidden');
    updateRewardsDock(shouldShow);
  }

  function updateRewardsDock(forceVisible) {
    if (!rewardsDock) return;
    const shouldShow = typeof forceVisible === 'boolean'
      ? forceVisible
      : state.currentStage !== 'mission-hero';

    rewardsDock.setAttribute('data-visibility', shouldShow ? 'visible' : 'hidden');
  }

  function updateProgressPills() {
    const currentIndex = stageIndex(state.currentStage);
    progressPills.forEach(pill => {
      const pillStage = pill.getAttribute('data-stage');
      if (!pillStage) return;
      const pillIndex = stageIndex(pillStage);
      if (pillIndex === -1) return;
      if (pillIndex > state.unlockedIndex) {
        pill.setAttribute('data-stage-state', 'hidden');
      } else if (pillIndex === currentIndex) {
        pill.setAttribute('data-stage-state', 'active');
      } else if (pillIndex < currentIndex) {
        pill.setAttribute('data-stage-state', 'completed');
      } else {
        pill.setAttribute('data-stage-state', 'pending');
      }
    });
  }

  function setCurrentStage(stageId) {
    if (!stageId || stageId === state.currentStage) {
      updateHiddenStage();
      updateProgressDock();
      updateProgressPills();
      return;
    }
    const idx = stageIndex(stageId);
    if (idx === -1 || idx > state.unlockedIndex) return;
    state.currentStage = stageId;
    updateHiddenStage();
    updateProgressDock();
    updateProgressPills();
  }

  function unlockStage(targetIndex) {
    if (targetIndex > state.unlockedIndex) {
      // Trigger warp speed transition
      triggerWarpEffect();
      
      // Unlock reward for the PREVIOUS stage (the one just completed)
      const completedStageIndex = state.unlockedIndex;
      if (completedStageIndex > 0) {
        unlockReward(completedStageIndex);
      }
      
      state.unlockedIndex = targetIndex;
      updateProgressPills();
      
      // Reveal all stages up to the unlocked index so they remain visible when scrolling back
      for (let i = 0; i <= targetIndex && i < stageIds.length; i++) {
        setRevealed(stageIds[i], true);
      }
    }
  }

  function unlockReward(stageIndex) {
    const stageId = stageIds[stageIndex];
    const rewardStages = ['mission-persona', 'mission-goal', 'mission-readiness'];
    const rewardIndex = rewardStages.indexOf(stageId);
    if (rewardIndex === -1 || rewardIndex >= rewardItems.length) return;

    const rewardItem = rewardItems[rewardIndex];
    if (!rewardItem) return;

    // Mark as unlocked
    rewardItem.setAttribute('data-unlocked', 'true');
    
    // Change icon from help-circle to check-circle
    const lockedIcon = rewardItem.querySelector('.reward-locked i');
    if (lockedIcon) {
      lockedIcon.setAttribute('data-lucide', 'check-circle');
    }
    
    // Show download button (hidden until hover) and remember it for the overlay CTA
    const downloadBtn = rewardItem.querySelector('.reward-download');
    if (downloadBtn) {
      downloadBtn.classList.remove('hidden');
      lastUnlockedRewardButton = downloadBtn;
    }

    // Show subtle toast notification instead of modal overlay
    showRewardToast(rewardIndex);

    // Refresh icons to render the new check-circle
    refreshIcons();
  }

  let rewardDismissTimer = null;

  function initRewardOverlay() {
    if (!rewardOverlay) return;

    function closeRewardOverlay() {
      rewardOverlay.setAttribute('data-open', 'false');
      rewardOverlay.setAttribute('aria-hidden', 'true');
      if (rewardDismissTimer) {
        clearTimeout(rewardDismissTimer);
        rewardDismissTimer = null;
      }
    }

    if (rewardPrimary) {
      rewardPrimary.addEventListener('click', () => {
        if (lastUnlockedRewardButton) {
          lastUnlockedRewardButton.click();
        }
        closeRewardOverlay();
      });
    }

    rewardDismiss?.addEventListener('click', closeRewardOverlay);
  }

  // Subtle toast notification instead of modal popup
  function showRewardToast(rewardIndex) {
    if (!rewardCopy.length) return;
    const copyIdx = Math.max(0, Math.min(rewardCopy.length - 1, rewardIndex));
    const cfg = rewardCopy[copyIdx];

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'reward-toast';
    toast.innerHTML = `
      <div class="reward-toast-content">
        <i data-lucide="check-circle" class="w-5 h-5 text-cyan-400"></i>
        <div>
          <p class="reward-toast-title">${cfg.title}</p>
          <p class="reward-toast-desc">${cfg.description}</p>
        </div>
        <button class="reward-toast-close" aria-label="Dismiss">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    document.body.appendChild(toast);
    refreshIcons();

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('reward-toast-visible');
    });

    // Close button handler
    const closeBtn = toast.querySelector('.reward-toast-close');
    closeBtn?.addEventListener('click', () => {
      toast.classList.remove('reward-toast-visible');
      setTimeout(() => toast.remove(), 300);
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      toast.classList.remove('reward-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  function recordEvent(id, properties = {}) {
    window._hsq = window._hsq || [];
    window._hsq.push(['trackCustomBehavioralEvent', {
      id,
      properties: {
        stage: state.currentStage,
        persona: state.persona ? personaConfig[state.persona].label : null,
        goal: state.goal ? goalConfig[state.goal].label : null,
        pain: state.pain ? painConfig[state.pain].label : null,
        priority: state.priority,
        ...properties
      }
    }]);
  }

  function getMissionTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  function updateTelemetry(message) {
    if (!elements.telemetry) return;
    const savedY = window.scrollY;
    const entry = document.createElement('div');
    entry.className = 'rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 transition-opacity duration-500 opacity-0 telemetry-entry';
    entry.setAttribute('data-timestamp', getMissionTime());

    const messageSpan = document.createElement('span');
    messageSpan.className = 'telemetry-message';
    messageSpan.textContent = message;
    entry.appendChild(messageSpan);

    // Append (we use column-reverse in CSS so newest appears visually on top)
    elements.telemetry.appendChild(entry);
    requestAnimationFrame(() => {
      entry.classList.remove('opacity-0');
      // Restore scroll to avoid jumps when entries are prepended
      window.scrollTo({ top: savedY, behavior: 'auto' });
    });
  }

  // Replace feed with relevant entries based on current selections
  function setTelemetry(messages = []) {
    if (!elements.telemetry) return;
    const savedY = window.scrollY;
    elements.telemetry.innerHTML = '';
    messages.forEach(msg => {
      const entry = document.createElement('div');
      entry.className = 'rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 transition-opacity duration-500 opacity-0 telemetry-entry';
      entry.setAttribute('data-timestamp', getMissionTime());

      const messageSpan = document.createElement('span');
      messageSpan.className = 'telemetry-message';
      messageSpan.textContent = msg;
      entry.appendChild(messageSpan);

      elements.telemetry.appendChild(entry);
      requestAnimationFrame(() => {
        entry.classList.remove('opacity-0');
        // Restore scroll to avoid jumps when replacing the feed
        window.scrollTo({ top: savedY, behavior: 'auto' });
      });
    });
  }

  function renderTelemetryFeed() {
    const messages = [];
    const p = state.persona ? personaConfig[state.persona] : null;
    const g = state.goal ? goalConfig[state.goal] : null;
    const pain = state.pain ? painConfig[state.pain] : null;

    if (p) {
      messages.push(`${p.label} focus: ${p.subtext}`);
    }
    if (pain) {
      messages.push(`Obstacle: ${pain.label} - ${pain.detail}`);
    }
    if (g) {
      messages.push(`Objective: ${g.label} - ${g.descriptor}`);
    }

    // Persona × Goal specific signals (targets, levers, KPIs)
    const recipe = (state.persona && state.goal && telemetryRecipes[state.persona])
      ? telemetryRecipes[state.persona][state.goal]
      : null;
    if (Array.isArray(recipe) && recipe.length) {
      recipe.forEach(line => messages.push(line));
    }

    // If a pain is selected, suggest a remedy that maps to action
    if (state.pain && painRemedies[state.pain]) {
      messages.push(`Remedy: ${painRemedies[state.pain]}`);
    }

    // Readiness hint
    if (state.goal) messages.push('Readiness checklist is primed for confirmation.');

    // Suggested next step from CTA config
    const ctaCfg = state.persona && state.goal && ctaMatrix[state.persona] ? ctaMatrix[state.persona][state.goal] : null;
    if (ctaCfg && ctaCfg.primary) {
      messages.push(`Next step: ${ctaCfg.primary.label}`);
    }

    setTelemetry(messages.length ? messages : ['Make a selection to tune the console.']);
  }

  function saveState() {
    // persistence disabled
  }

  function loadState() {
    // restore disabled
  }

  function setButtonState(button, enabled) {
    if (!button) return;
    button.disabled = !enabled;
  }

  function updateHidden(fieldKey, value) {
    if (hiddenFields[fieldKey]) {
      hiddenFields[fieldKey].value = value || '';
    }
  }

  function renderGoals() {
    const goalConsole = document.getElementById('goal-console');
    if (!goalConsole || !state.persona) return;

    goalConsole.innerHTML = '';

    // Prefer advisor alias keys for Advisor; canonical keys for others
    const advisorAliases = ['build_recurring', 'project_services', 'retention_upsell', 'co_sell'];
    const canonicalBase = ['recurring', 'services', 'retention', 'cosell'];
    const persona = state.persona;
    const preferred = persona === 'advisor' ? advisorAliases : canonicalBase;

    const seen = new Set();
    const renderList = [];

    // Add preferred keys first if allowed for persona
    preferred.forEach(k => {
      const cfg = goalConfig[k];
      if (!cfg) return;
      if (cfg.personas && cfg.personas.includes(persona)) {
        const norm = normalizeGoalKey(k);
        if (!seen.has(norm)) {
          seen.add(norm);
          renderList.push(k);
        }
      }
    });

    // Add any other persona-allowed goals, deduped by normalized key
    Object.keys(goalConfig).forEach(k => {
      const cfg = goalConfig[k];
      if (!cfg || !cfg.personas || !cfg.personas.includes(persona)) return;
      const norm = normalizeGoalKey(k);
      if (seen.has(norm)) return;
      seen.add(norm);
      renderList.push(k);
    });

    renderList.forEach(goalKey => {
      const goal = goalConfig[goalKey];
      const personaOverride = personaGoalDescriptors[persona] && personaGoalDescriptors[persona][goalKey];
      const displayLabel = personaOverride ? personaOverride.label : goal.label;
      const displayDescriptor = personaOverride ? personaOverride.descriptor : goal.descriptor;

      const button = document.createElement('button');
      button.className = 'goal-toggle';
      button.setAttribute('data-goal', goalKey);
      button.setAttribute('data-active', state.goal === normalizeGoalKey(goalKey) ? 'true' : 'false');
      button.setAttribute('type', 'button');

      button.innerHTML = `
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Objective</p>
          <h3 class="text-xl font-semibold mt-1 text-slate-800">${displayLabel}</h3>
          <p class="text-sm text-slate-500 mt-2">${displayDescriptor}</p>
        </div>
        <i data-lucide="${goal.icon}" class="w-9 h-9 text-slate-600"></i>
      `;

      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        disableSnapTemporarily();
      });
      button.addEventListener('touchstart', () => {
        disableSnapTemporarily();
      }, { passive: true });
      button.addEventListener('click', (e) => {
        e.preventDefault();
        disableSnapTemporarily();
        withPreservedScroll(() => {
          const prevTabIndex = button.getAttribute('tabindex');
          button.setAttribute('tabindex', '-1');
          button.blur();
          applyGoal(goalKey);
          if (state.pain) {
            renderStory();
            renderCtas();
          }
        });
        setTimeout(() => {
          if (prevTabIndex === null) button.removeAttribute('tabindex'); else button.setAttribute('tabindex', prevTabIndex);
        }, 500);
      });

      goalConsole.appendChild(button);
    });

    refreshIcons();
  }

  // Container-level guard to suppress focus/anchor on goal tiles (covers static + dynamic)
  (function initGoalConsoleGuards(){
    const gc = document.getElementById('goal-console');
    if (!gc) return;
    gc.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('.goal-toggle');
      if (btn) {
        e.preventDefault();
        disableSnapTemporarily();
      }
    }, { capture: true });
    gc.addEventListener('touchstart', (e) => {
      const btn = e.target.closest('.goal-toggle');
      if (btn) {
        // Need non-passive to allow preventDefault on iOS Safari
        try { e.preventDefault(); } catch (_) {}
        disableSnapTemporarily();
      }
    }, { passive: false, capture: true });
  })();

  function applyPersona(key, autoScroll = false) {
    if (!personaConfig[key]) return;
    state.persona = key;
    personaButtons.forEach(btn => {
      const active = btn.getAttribute('data-persona') === key;
      btn.setAttribute('data-active', active ? 'true' : 'false');
    });

    // Get all persona detail panels
    const allPanels = {
      msp: document.getElementById('msp-detail-panel'),
      distributor: document.getElementById('distributor-detail-panel'),
      si: document.getElementById('si-detail-panel'),
      advisor: document.getElementById('advisor-detail-panel')
    };

    // Hide all panels first
    Object.values(allPanels).forEach(panel => {
      if (panel) panel.classList.add('hidden');
    });

    // Show the selected panel with a brief transition
    if (allPanels[key]) {
      const panel = allPanels[key];
      const doShow = () => {
        panel.classList.remove('hidden');
        panel.classList.add('panel-enter');
        setTimeout(() => { panel.classList.remove('panel-enter'); }, 520);
        personaLayout?.classList.add('msp-expanded');
      };
      if (personaGrid && !personaGrid.classList.contains('hidden')) {
        personaGrid.classList.add('animate-out');
        setTimeout(() => {
          personaGrid.classList.add('hidden');
          personaGrid.classList.remove('animate-out');
          doShow();
        }, 420);
      } else {
        doShow();
      }
      
      if (key === 'msp') {
        updateMspConfirmState();
      }
      if (key === 'advisor') {
        updateAdvisorConfirmState();
      }
      if (key === 'si') {
        updateSiConfirmState();
      }
    } else {
      // No detail panel for this persona, show grid
      personaGrid?.classList.remove('hidden');
      personaLayout?.classList.remove('msp-expanded');
    }

    const persona = personaConfig[key];
    if (elements.heroSummary) elements.heroSummary.textContent = persona.hero;

    // Update Stage 2 intro text based on persona
    if (elements.goalIntro) {
      elements.goalIntro.textContent = `Console is tuned for ${persona.short} operators. Pick your destination.`;
    }

    // Render goals dynamically based on persona
    renderGoals();

    // Show personalized insight
    showPersonaInsight(key);

    renderTelemetryFeed();
    updateHidden('partner', persona.label);
    saveState();
    recordEvent('journey_persona_selected');
    unlockStage(2);
  }

  function renderPriority() {
    if (!elements.priorityLabel) return;
    const value = state.priority;
    let descriptor = 'Momentum';
    if (value >= 90) descriptor = 'Hyperdrive';
    else if (value >= 70) descriptor = 'Momentum';
    else if (value >= 50) descriptor = 'Stabilize';
    else descriptor = 'Incubate';
    elements.priorityLabel.textContent = `${value} · ${descriptor}`;
    updateHidden('priority', value);

    // Update the vertical fuel gauge to match slider
    const gauge = document.getElementById('fuel-fill');
    if (gauge) {
      const min = Number(prioritySlider?.min ?? 0);
      const max = Number(prioritySlider?.max ?? 100);
      const clamped = Math.max(min, Math.min(max, value));
      const pct = (clamped - min) / Math.max(1, (max - min));
      const floor = 0.06; // keep a visible baseline
      const h = Math.max(floor, Math.min(1, pct));
      gauge.style.height = Math.round(h * 100) + '%';
      gauge.style.opacity = 0.9;
    }
  }

  function applyGoal(key, autoScroll = false) {
    disableSnapTemporarily();
    const gKey = normalizeGoalKey(key);
    if (!goalConfig[gKey]) return;
    state.goal = gKey;
    // Update active states for dynamically rendered goal buttons
    const dynButtons = Array.from(document.querySelectorAll('#goal-console .goal-toggle'));
    dynButtons.forEach(btn => {
      const btnKey = btn.getAttribute('data-goal');
      const active = normalizeGoalKey(btnKey) === gKey;
      btn.setAttribute('data-active', active ? 'true' : 'false');
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const goal = goalConfig[gKey];
    if (elements.consoleReadout) elements.consoleReadout.textContent = goal.label;
    if (elements.consoleSubtext) elements.consoleSubtext.textContent = goal.descriptor;
    if (elements.goalSignal) elements.goalSignal.textContent = goal.telemetry;
    if (trajectoryControls) trajectoryControls.classList.remove('hidden');
    if (elements.readinessIntro && state.persona) {
      const persona = personaConfig[state.persona];
      elements.readinessIntro.textContent = `${persona.short} readiness loaded for ${goal.label.toLowerCase()}. Confirm owners and pacing to launch actions.`;
    }
    renderTelemetryFeed();
    updateHidden('goal', goal.label);
    saveState();
    recordEvent('journey_goal_selected');
    updateGoalConfirmState();
    
    // Show personalized insight for goal
    showGoalInsight(gKey);
  }

  function applyPain(key, autoScroll = false) {
    if (!painConfig[key]) return;
    state.pain = key;
    painButtons.forEach(btn => {
      const active = btn.getAttribute('data-pain') === key;
      btn.setAttribute('data-active', active ? 'true' : 'false');
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const pain = painConfig[key];
    renderTelemetryFeed();
    if (elements.goalSignal) {
      elements.goalSignal.textContent = `${pain.detail} Noted. We’ll weave this into your course correction.`;
    }
    updateHidden('pain', pain.label);
    saveState();
    recordEvent('journey_pain_selected');
    updateGoalConfirmState();
  }

  function renderStory() {
    if (!state.goal) return;
    const container = elements.storyCards || document.getElementById('story-cards');
    if (!container) return; // story section not present in this template
    const persona = personaConfig[state.persona] || { short: 'partner' };
    const key = normalizeGoalKey(state.goal);
    // Use persona-specific stories if available, otherwise fallback to generic
    const cardsSource = (personaStories[state.persona] && personaStories[state.persona][key]) 
      || storyDeck[key];
    if (!cardsSource) { container.innerHTML = ''; return; }
    const cards = cardsSource
      .map((card, index) => {
        const body = typeof card.copy === 'function' ? card.copy(persona) : card.copy;
        const ctaConfig = (ctaMatrix[state.persona] && (ctaMatrix[state.persona][key] || ctaMatrix[state.persona][state.goal])) || null;
        let nextValue = card.badge;
        if (ctaConfig) {
          const labels = [
            ctaConfig.primary && ctaConfig.primary.label,
            ctaConfig.secondary && ctaConfig.secondary[0] && ctaConfig.secondary[0].label,
            ctaConfig.secondary && ctaConfig.secondary[1] && ctaConfig.secondary[1].label
          ].filter(Boolean);
          if (labels.length) nextValue = labels[index % labels.length];
        }
        return `
          <article class="story-card snap-center" tabindex="0">
            <div class="story-ribbon">
              <i data-lucide="${card.icon}" class="w-4 h-4"></i>
              <span>${card.badge}</span>
            </div>
            <h3 class="text-2xl font-semibold mt-5 text-slate-800">${card.title}</h3>
            <p class="text-slate-600 mt-4 text-sm leading-relaxed">${body}</p>
            <div class="story-aux">
              <div class="story-aux-label">${card.badge}</div>
              <div class="story-aux-value">${nextValue}</div>
            </div>
            <div class="story-proof">
              <div class="story-proof-label">PROOF</div>
              <div class="story-proof-value">${card.stat}</div>
            </div>
            <div class="absolute top-6 right-6 text-xs uppercase tracking-[0.3em] text-slate-400">0${index + 1}</div>
          </article>`;
      })
      .join('');
    container.innerHTML = cards;
    refreshIcons();

    // Ensure hover-reveal works consistently via attribute toggle
    container.querySelectorAll('.story-card').forEach(card => {
      const on = () => card.setAttribute('data-hover', '1');
      const off = () => card.removeAttribute('data-hover');
      card.addEventListener('mouseenter', on);
      card.addEventListener('mouseleave', off);
      card.addEventListener('focusin', on);
      card.addEventListener('focusout', off);
    });
  }

  function renderCtas() {
    // Big Fish vs Small Fish decision logic
    // Big Fish: Enterprise customers OR expecting 4+ intro accounts in 30 days
    // Note: HTML button uses data-value="a4_plus" for the "4+" option
    const isBigFish =
      state.targetCustomerSize === 'Enterprise' ||
      state.introAccounts30d === 'a4_plus';

    // Book a Call CTA (shown for Big Fish or as fallback)
    const bookCallHtml = `
      <a href="${BOOK_MEETING_LINK}" data-variant="secondary" data-cta-id="book_meeting" target="_blank">
        <i data-lucide="calendar" class="w-5 h-5"></i>
        <span>Book a Call</span>
      </a>`;

    // Activate Now CTA (automated onboarding path)
    const activateNowHtml = `
      <a href="#" data-variant="primary" data-cta-id="become_partner">
        <i data-lucide="rocket" class="w-5 h-5"></i>
        <span>Activate Now</span>
      </a>`;

    // Render CTAs based on Big Fish vs Small Fish
    if (elements.ctaGrid) {
      if (isBigFish) {
        // Big Fish: Show BOTH "Book a Call" + "Activate Now"
        // Give them the option to talk to sales OR self-service
        elements.ctaGrid.innerHTML = `
          ${bookCallHtml}
          ${activateNowHtml}`;
      } else {
        // Small Fish: Show ONLY "Activate Now" (automated onboarding)
        elements.ctaGrid.innerHTML = activateNowHtml;
      }
    }

    // Update headline/subhead if config exists
    if (state.persona && state.goal && ctaMatrix[state.persona]) {
      const normalizedGoal = normalizeGoalKey(state.goal);
      const config = ctaMatrix[state.persona][normalizedGoal] || ctaMatrix[state.persona][state.goal];
      if (config) {
        if (elements.ctaHeadline) elements.ctaHeadline.textContent = config.headline;
        if (elements.ctaSubhead) elements.ctaSubhead.textContent = config.subhead;
      }
    }

    refreshIcons();
  }

  let pendingCta = null;

  function setOverlay(open) {
    if (!emailOverlay) return;
    emailOverlay.setAttribute('data-open', open ? 'true' : 'false');
    emailOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
      emailError && (emailError.style.display = 'none');
      setTimeout(() => emailInput && emailInput.focus(), 10);
    }
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
  }

  const launchOverlay = document.getElementById('launch-overlay');
  const thrustFill = document.getElementById('thrust-fill');

  function playLaunch(cb) {
    if (!launchOverlay || !thrustFill) { cb && cb(); return; }
    launchOverlay.setAttribute('data-active', 'true');
    thrustFill.style.width = '0%';
    requestAnimationFrame(() => {
      thrustFill.style.width = '100%';
    });
    setTimeout(() => {
      launchOverlay.setAttribute('data-active', 'false');
      cb && cb();
    }, 800);
  }

  function finalizeCta(ctaId, label, href) {
    state.cta = ctaId;
    updateHidden('cta', label);
    saveState();
    submitToHubSpot();
    recordEvent('journey_cta_clicked', { cta: ctaId });

    // Dual-write: Send to Java backend and redirect for partner onboarding
    if (ctaId === 'become_partner') {
      const backendPayload = {
        email: state.email,
        firstName: state.firstname,
        lastName: state.lastname,
        company: state.business_name || '',
        partnerType: state.persona,
        goal: state.goal,
        targetSize: state.targetCustomerSize,
        regions: (state.regionsServed || []).join('; '),
        mspOffers: (state.mspOffers || []).join('; '),
        whiteLabelRequired: state.whiteLabelRequired || ''
      };

      fetch('https://partners.wanaware.com/hubspot-onboarding-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload)
      })
      .then(() => {
        // Redirect to onboarding app
        window.location.href = `https://onboarding.wanaware.com/start?email=${encodeURIComponent(state.email)}`;
      })
      .catch((e) => {
        console.warn('Backend hook failed, redirecting anyway:', e);
        window.location.href = `https://onboarding.wanaware.com/start?email=${encodeURIComponent(state.email)}`;
      });
      return;
    }

    if (missionForm && typeof missionForm.submit === 'function') {
      missionForm.dispatchEvent(new Event('submit', { cancelable: true }));
    }
    playLaunch(() => {
      if (href && href !== '#') {
        window.open(href, '_blank');
      }
    });
  }


  function handleCtaClick(event) {
    const link = event.target.closest('a[data-cta-id]');
    if (!link) return;
    event.preventDefault();
    const ctaId = link.getAttribute('data-cta-id');
    const label = link.textContent.trim();
    const href = link.getAttribute('href');

    if (!state.email) {
      pendingCta = { ctaId, label, href };
      setOverlay(true);
      return;
    }
    finalizeCta(ctaId, label, href);
  }

  function observeStages() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const stage = entry.target.getAttribute('data-stage');
        if (!stage) return;
        const idx = stageIndex(stage);
        if (idx > state.unlockedIndex) {
          const allowedStage = stageIds[state.unlockedIndex];
          if (allowedStage) {
            setCurrentStage(allowedStage);
          }
          return;
        }
        setCurrentStage(stage);
      });
    }, {
      threshold: 0.55
    });

    stageIds.forEach(id => {
      const el = document.querySelector(`[data-stage="${id}"]`);
      if (el) observer.observe(el);
    });
  }

  const syncSideDockVisibility = () => updateProgressDock();
  window.addEventListener('scroll', syncSideDockVisibility, { passive: true });
  if (missionScroll) {
    missionScroll.addEventListener('scroll', syncSideDockVisibility, { passive: true });
  }
  window.addEventListener('resize', syncSideDockVisibility);

  beginMission?.addEventListener('click', () => {
    recordEvent('journey_begin_clicked');
    // Skip mission-briefing (index 1) and go straight to mission-persona (index 2)
    unlockStage(2);
    setCurrentStage('mission-persona');
    setRevealed('mission-persona', true);
    temporarilyUnlockAndScroll('#mission-persona');
  });

  briefingAdvance?.addEventListener('click', () => {
    recordEvent('journey_briefing_complete');
    unlockStage(2);
    setCurrentStage('mission-persona');
    setRevealed('mission-persona', true);
    temporarilyUnlockAndScroll('#mission-persona');
  });

  personaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      disableSnapTemporarily();
      const key = btn.getAttribute('data-persona');
      applyPersona(key);
    });
  });

  goalButtons.forEach(btn => {
    // ensure static markup buttons behave like pure buttons
    if (btn.getAttribute('type') !== 'button') btn.setAttribute('type', 'button');
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); }); // avoid focus-induced snaps
    btn.addEventListener('click', () => {
      disableSnapTemporarily();
      const key = btn.getAttribute('data-goal');
      withPreservedScroll(() => {
        const prevTabIndex = btn.getAttribute('tabindex');
        btn.setAttribute('tabindex', '-1');
        btn.blur();
        applyGoal(key);
        // lock grid to selected card
        missionGoalSection?.setAttribute('data-goal-locked', 'true');
        changeGoalBtn?.classList.remove('hidden');
        if (state.pain) {
          renderReadiness();
        }
      });
      setTimeout(() => {
        if (prevTabIndex === null) btn.removeAttribute('tabindex'); else btn.setAttribute('tabindex', prevTabIndex);
      }, 500);
    });
  });

  goalConfirm?.addEventListener('click', () => {
    if (!state.goal || !state.pain) return;
    disableSnapTemporarily();
    const goal = goalConfig[state.goal];
    if (elements.goalSignal && goal) {
      elements.goalSignal.textContent = `${goal.label} locked. Readiness checklist generating.`;
    }
    updateTelemetry(`${goal.label} course confirmed. Readiness loading.`);
    submitToHubSpot();
    recordEvent('journey_goal_confirmed');
    unlockStage(4);
    renderReadiness();
    setCurrentStage('mission-readiness');
    setRevealed('mission-readiness', true);
    temporarilyUnlockAndScroll('#mission-readiness');
  });

  painButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      disableSnapTemporarily();
      const key = btn.getAttribute('data-pain');
      applyPain(key);
      if (state.goal) {
        renderReadiness();
      }
    });
  });

  prioritySlider?.addEventListener('input', event => {
    state.priority = Number(event.target.value);
    renderPriority();
    saveState();
    recordEvent('journey_priority_adjusted', { priority: state.priority });
  });

  readinessAdvance?.addEventListener('click', () => {
    const missing = [];
    const eVal = state.execSponsorNamed;
    const eOk = eVal === 'true' || eVal === 'false' || eVal === 'Yes' || eVal === 'No';
    if (!state.kickoffWindow) missing.push('kickoffWindow');
    if (!eOk) missing.push('execSponsorNamed');
    if (!state.weeklyTimeCommitment) missing.push('weeklyTimeCommitment');
    if (missing.length) {
      try { console.warn('Readiness confirm blocked. Missing:', missing.join(', ')); } catch(_) {}
      return;
    }
    disableSnapTemporarily();
    updateTelemetry('Readiness confirmed. Generating tailored actions.');
    submitToHubSpot();
    recordEvent('journey_readiness_confirmed');
    unlockStage(5);
    renderStory();
    renderCtas();
    setCurrentStage('mission-cta');
    setRevealed('mission-cta', true);
    temporarilyUnlockAndScroll('#mission-cta');
  });

  elements.ctaGrid?.addEventListener('click', handleCtaClick);

  // ============================================
  // HUBSPOT FORM SUBMISSION
  // ============================================
  // Submit journey data via HubSpot Forms API
  // Replace YOUR_PORTAL_ID and YOUR_FORM_ID with actual values
  // ============================================
  function submitToHubSpot(firstname, lastname, email) {
    console.log('📤 Submitting to HubSpot Forms API...');

    // Submit via HubSpot Forms API (direct fetch, no dependencies needed)
    const formData = {
      fields: [
        { name: 'email', value: email }, // Standard HubSpot email field (required for contact identification)
        { name: 'firstname', value: firstname }, // Standard HubSpot firstname field
        { name: 'lastname', value: lastname }, // Standard HubSpot lastname field
        { name: 'journey_first_name', value: firstname },
        { name: 'journey_last_name', value: lastname },
        { name: 'journey_email', value: email },
        { name: 'journey_business_name', value: state.business_name || '' },
        { name: 'journey_business_website', value: state.business_website || '' },
        { name: 'journey_msp_offers', value: (state.mspOffers || []).join('; ') },
        { name: 'journey_target_customer_size', value: state.targetCustomerSize || '' },
        { name: 'journey_regions_served', value: (state.regionsServed || []).join('; ') },
        { name: 'journey_white_label_required', value: state.whiteLabelRequired || '' },
        { name: 'journey_time_to_start', value: state.timeToStart || '' },
        { name: 'journey_process_owner', value: state.processOwner || '' },
        { name: 'journey_active_customer_band', value: state.activeCustomerBand || '' },
        { name: 'journey_intro_accounts_30d', value: state.introAccounts30d || '' },
        { name: 'journey_kickoff_window', value: state.kickoffWindow || '' },
        { name: 'journey_exec_sponsor_named', value: state.execSponsorNamed || '' },
        { name: 'journey_weekly_time_commitment', value: state.weeklyTimeCommitment || '' },
        { name: 'journey_partner_type', value: state.persona ? personaConfig[state.persona].label : '' },
        { name: 'journey_goal', value: state.goal ? goalConfig[state.goal].label : '' },
        { name: 'journey_pain_point', value: state.pain ? painConfig[state.pain].label : '' },
        { name: 'journey_priority', value: state.priority.toString() },
        { name: 'journey_completion_stage', value: state.currentStage },
        { name: 'journey_cta_selected', value: state.cta || '' },
        { name: 'journey_subscribe_for_updates', value: state.subscribeForUpdates || '' },
        { name: 'journey_stage1_collateral', value: state.stage1Collateral ? 'true' : 'false' },
        { name: 'journey_stage2_collateral', value: state.stage2Collateral ? 'true' : 'false' },
        { name: 'journey_stage3_collateral', value: state.stage3Collateral ? 'true' : 'false' }
      ]
    };

    // Replace with your actual Portal ID and Form ID
    const portalId = '46424092'; // Your Hub ID
    const formGuid = '6dc09031-744c-4f27-8147-bdfb53d009ee'; // MSP Journey Capture form

    fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('✅ HubSpot form submitted successfully:', data);
    })
    .catch(error => {
      console.error('❌ HubSpot form submission failed:', error);
      // Fallback to hidden form
      if (missionForm && typeof missionForm.submit === 'function') {
        missionForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  }

  // Email overlay interactions
  emailConfirm?.addEventListener('click', () => {
    if (!firstnameInput || !lastnameInput || !emailInput) return;

    const firstname = firstnameInput.value.trim();
    const lastname = lastnameInput.value.trim();
    const email = emailInput.value.trim();
    const businessName = businessNameInput ? businessNameInput.value.trim() : '';
    const businessWebsite = businessWebsiteInput ? businessWebsiteInput.value.trim() : '';

    // Validate all fields
    if (!firstname || !lastname || !validEmail(email)) {
      if (emailError) emailError.style.display = 'block';
      return;
    }

    // Hide error if shown
    if (emailError) emailError.style.display = 'none';

    // Update state and hidden fields
    state.email = email;
    state.firstname = firstname;
    state.lastname = lastname;
    state.business_name = businessName;
    state.business_website = businessWebsite;
    updateHidden('firstname', firstname);
    updateHidden('lastname', lastname);
    updateHidden('email', email);
    updateHidden('business_name', businessName);
    updateHidden('business_website', businessWebsite);
    console.log('✅ Email captured:', email, '| Hidden field value:', hiddenFields.email?.value);
    recordEvent('journey_email_captured', { firstname, lastname, email });

    // Submit to HubSpot
    submitToHubSpot(firstname, lastname, email);

    // Redirect to onboarding app with captured data
    const onboardingParams = new URLSearchParams({
      email: email,
      firstName: firstname,
      lastName: lastname,
      company: businessName || '',
      website: businessWebsite || '',
      partnerType: state.persona || 'advisor',
      goal: state.goal || '',
      // Add additional context from journey
      mspOffers: state.mspOffers?.join(',') || '',
      targetSize: state.targetCustomerSize || '',
      regions: state.regionsServed?.join(',') || '',
      whiteLabelRequired: state.whiteLabelRequired || ''
    });

    // Redirect to onboarding app
    const onboardingUrl = `https://onboarding-app-lime.vercel.app/kyc?${onboardingParams.toString()}`;
    console.log('🚀 Redirecting to onboarding app:', onboardingUrl);

    // Add small delay to ensure HubSpot submission completes
    setTimeout(() => {
      window.location.href = onboardingUrl;
    }, 500);

    // Don't continue with the normal flow - we're redirecting
    // setOverlay(false);
    // if (pendingCta) {
    //   const { ctaId, label, href } = pendingCta;
    //   pendingCta = null;
    //   finalizeCta(ctaId, label, href);
    // }
  });

  emailCancel?.addEventListener('click', () => {
    setOverlay(false);
    pendingCta = null;
  });

  // Allow Enter key to submit from any input field
  [firstnameInput, lastnameInput, emailInput, businessNameInput, businessWebsiteInput].forEach(input => {
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        emailConfirm?.click();
      }
    });
  });

  progressPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const target = pill.getAttribute('data-stage');
      const idx = stageIndex(target);
      if (!target || idx === -1 || idx > state.unlockedIndex) return;
      setCurrentStage(target);
      setRevealed(target, true);
      temporarilyUnlockAndScroll(`#${target}`);
    });
  });

  // Intercept anchor navigation to respect gating
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      const id = href ? href.slice(1) : '';
      const idx = stageIds.indexOf(id);
      if (idx === -1) return; // Not a stage link
      e.preventDefault();
      if (idx > state.unlockedIndex) {
        const allowed = stageIds[state.unlockedIndex];
        setCurrentStage(allowed);
        setRevealed(allowed, true);
        temporarilyUnlockAndScroll(`#${allowed}`);
        return;
      }
      setCurrentStage(id);
      setRevealed(id, true);
      temporarilyUnlockAndScroll(`#${id}`);
    });
  });

  // Setup download button handlers
  function setupDownloadButtons() {
    const downloadButtons = document.querySelectorAll('[data-download]');
    downloadButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const downloadType = button.getAttribute('data-download');
        
        // Check if this is the sales guide download
        let pdfUrl;
        let downloadLabel;
        
        if (downloadType === 'sales-guide') {
          pdfUrl = 'https://46424092.fs1.hubspotusercontent-na2.net/hubfs/46424092/WanAware%20Partner%20Sales%20Guide%202025.pdf';
          downloadLabel = 'Mission Playbook';
        } else {
          // All other downloads use persona-specific PDF
          const persona = state.persona || 'msp';
          pdfUrl = pdfUrls[persona];
          downloadLabel = 'Partnership Offering';
        }
        
        if (!pdfUrl) {
          console.warn('No PDF URL found for download type:', downloadType);
          return;
        }
        
        // Track the download event
        recordEvent('partnership_offering_downloaded', { 
          type: downloadType,
          persona: state.persona,
          goal: state.goal,
          stage: state.currentStage
        });
        
        // Mark collateral as downloaded based on type
        if (downloadType === 'persona-guide') {
          state.stage1Collateral = true;
          updateHidden('stage1_collateral', 'true');
        } else if (downloadType === 'goal-playbook') {
          state.stage2Collateral = true;
          updateHidden('stage2_collateral', 'true');
        } else if (downloadType === 'sales-guide') {
          state.stage3Collateral = true;
          updateHidden('stage3_collateral', 'true');
        }
        
        // Save state and re-submit to HubSpot with updated collateral flags
        saveState();
        if (state.email && state.firstname && state.lastname) {
          submitToHubSpot(state.firstname, state.lastname, state.email);
        }
        
        // Update telemetry
        updateTelemetry(`${downloadLabel} downloaded`);
        
        // Open PDF in new tab
        window.open(pdfUrl, '_blank');
      });
    });
  }

  observeStages();
  renderPriority();
  loadState();
  normalizeAcronymLabels();
  setButtonState(goalConfirm, Boolean(state.goal && state.pain));
  updateHiddenStage();
  updateProgressDock();
  updateProgressPills();
  refreshIcons();
  initHeroSpotlight();
  setupDownloadButtons();
  initRewardOverlay();
  initCountdownTimer();
  initRocketEasterEgg();

  // MSP detail panel interactions
  function showMspDetailPanel(show) {
    if (!mspPanel) return;
    if (show) {
      mspPanel.classList.remove('hidden');
      personaButtons.forEach(btn => { if (btn.getAttribute('data-persona') !== 'msp') btn.classList.add('hidden'); });
    } else {
      mspPanel.classList.add('hidden');
      personaButtons.forEach(btn => btn.classList.remove('hidden'));
    }
  }

  changePersonaBtns.forEach(btn => {
    btn?.addEventListener('click', () => {
      // reset persona-specific fields
      state.persona = null;
      state.mspOffers = [];
      state.targetCustomerSize = '';
      state.regionsServed = [];
      state.whiteLabelRequired = '';
      state.advisorFocus = [];
      state.coBrandRequired = '';
      // SI
      state.siFocus = [];
      state.projectLengthBand = '';
      state.verticals = [];
      state.siProcurementModel = '';
      // Distributor
      state.distributorFocus = [];
      state.activeResellerBand = '';
      state.dealRegPriceProtect = '';
      state.mdfAvailable = '';
      state.marketplaces = [];
      state.programLevers = [];
      state.enablementPlan = '';
      state.varActivationMotion = '';
      state.introVars30d = '';
      state.varEnablementPath = '';
      state.bundleSkuReady = '';
      state.activeCustomerBand = '';
      state.introAccounts30d = '';
      updateHidden('partner', '');
      updateHidden('msp_offers', '');
      updateHidden('advisor_focus', '');
      updateHidden('target_customer_size', '');
      updateHidden('regions_served', '');
      updateHidden('white_label_required', '');
      updateHidden('cobrand_required', '');
      updateHidden('si_focus', '');
      updateHidden('project_length_band', '');
      updateHidden('verticals', '');
      updateHidden('si_procurement_model', '');
      updateHidden('distributor_focus', '');
      updateHidden('active_reseller_band', '');
      updateHidden('deal_reg_price_protect', '');
      updateHidden('mdf_available', '');
      updateHidden('marketplaces', '');
      updateHidden('program_levers', '');
      updateHidden('enablement_plan', '');
      updateHidden('var_activation_motion', '');
      updateHidden('intro_vars_30d', '');
      updateHidden('var_enablement_path', '');
      updateHidden('bundle_sku_ready', '');
      updateHidden('customer_band', '');
      updateHidden('intro_accounts_30d', '');
      personaButtons.forEach(btn => btn.setAttribute('data-active', 'false'));
      [...mspOfferChips, ...mspRegionChips, ...advisorFocusChips, ...advisorRegionChips, ...distFocusChips, ...distRegionChips, ...siFocusChips, ...siVerticalChips, ...siRegionChips, ...bandBtns, ...introBtns, ...distBandBtns].forEach(chip => {
        chip.removeAttribute('data-active');
        chip.removeAttribute('aria-pressed');
      });
      [...mspSizeBtns, ...advisorSizeBtns, ...distDealregBtns, ...distMdfBtns, ...siLengthBtns, ...siProcureBtns].forEach(btn => {
        btn.removeAttribute('data-active');
        btn.removeAttribute('aria-pressed');
      });
      [...mspWhiteBtns, ...advisorCobrandBtns].forEach(btn => {
        btn.removeAttribute('data-active');
        btn.removeAttribute('aria-pressed');
      });
      document.querySelectorAll('.ready-system-row[data-system^="advisor-"]')
        .forEach(row => row.setAttribute('data-complete', 'false'));
      document.querySelectorAll('.ready-system-row[data-system^="traj-"]')
        .forEach(row => row.setAttribute('data-complete', 'false'));
      
      // Hide all persona detail panels
      const allPanels = [
        document.getElementById('msp-detail-panel'),
        document.getElementById('distributor-detail-panel'),
        document.getElementById('si-detail-panel'),
        document.getElementById('advisor-detail-panel')
      ];
      allPanels.forEach(panel => {
        if (panel) panel.classList.add('hidden');
      });
      
      personaGrid?.classList.remove('hidden');
      personaLayout?.classList.remove('msp-expanded');
    });
  });

  // Offers (multi)
  mspOfferChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-offer');
      const idx = state.mspOffers.indexOf(val);
      if (idx === -1) {
        state.mspOffers.push(val);
        chip.setAttribute('data-active', 'true');
        chip.setAttribute('aria-pressed', 'true');
      } else {
        state.mspOffers.splice(idx, 1);
        chip.removeAttribute('data-active');
        chip.removeAttribute('aria-pressed');
      }
      updateHidden('msp_offers', state.mspOffers.join('; '));
      recordEvent('msp_offer_toggled', { offer: val, active: idx === -1 });
      // Mark system row as complete if at least one selected
      const row = document.querySelector('.ready-system-row[data-system="msp-offers"]');
      if (row) row.setAttribute('data-complete', state.mspOffers.length > 0 ? 'true' : 'false');
      updateMspConfirmState();
    });
  });

  // Advisor focus (multi)
  advisorFocusChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-focus');
      const idx = state.advisorFocus.indexOf(val);
      if (idx === -1) {
        state.advisorFocus.push(val);
        chip.setAttribute('data-active', 'true');
        chip.setAttribute('aria-pressed', 'true');
      } else {
        state.advisorFocus.splice(idx, 1);
        chip.removeAttribute('data-active');
        chip.removeAttribute('aria-pressed');
      }
      updateHidden('advisor_focus', state.advisorFocus.join('; '));
      recordEvent('advisor_focus_toggled', { focus: val, active: idx === -1 });
      const row = document.querySelector('.ready-system-row[data-system="advisor-focus"]');
      if (row) row.setAttribute('data-complete', state.advisorFocus.length > 0 ? 'true' : 'false');
      updateAdvisorConfirmState();
    });
  });

  // Advisor target size (single)
  advisorSizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-size');
      state.targetCustomerSize = val;
      advisorSizeBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('target_customer_size', state.targetCustomerSize);
      recordEvent('advisor_target_size_selected', { size: state.targetCustomerSize });
      const row = document.querySelector('.ready-system-row[data-system="advisor-size"]');
      if (row) row.setAttribute('data-complete', state.targetCustomerSize ? 'true' : 'false');
      updateAdvisorConfirmState();
    });
  });

  // Advisor regions (multi)
  advisorRegionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-region');
      const idx = state.regionsServed.indexOf(val);
      if (idx === -1) {
        state.regionsServed.push(val);
        chip.setAttribute('data-active', 'true');
        chip.setAttribute('aria-pressed', 'true');
      } else {
        state.regionsServed.splice(idx, 1);
        chip.removeAttribute('data-active');
        chip.removeAttribute('aria-pressed');
      }
      updateHidden('regions_served', state.regionsServed.join('; '));
      recordEvent('advisor_region_toggled', { region: val, active: idx === -1 });
      const row = document.querySelector('.ready-system-row[data-system="advisor-regions"]');
      if (row) row.setAttribute('data-complete', state.regionsServed.length > 0 ? 'true' : 'false');
      updateAdvisorConfirmState();
    });
  });

  // Advisor co-brand required (single)
  advisorCobrandBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val') || '';
      state.coBrandRequired = val;
      advisorCobrandBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('cobrand_required', state.coBrandRequired);
      recordEvent('advisor_cobrand_selected', { value: state.coBrandRequired });
      const row = document.querySelector('.ready-system-row[data-system="advisor-cobrand"]');
      if (row) row.setAttribute('data-complete', state.coBrandRequired ? 'true' : 'false');
      updateAdvisorConfirmState();
    });
  });

  // Target size (single)
  mspSizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.targetCustomerSize = btn.getAttribute('data-size') || '';
      mspSizeBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('target_customer_size', state.targetCustomerSize);
      recordEvent('msp_target_size_selected', { size: state.targetCustomerSize });
      // Mark system row as complete
      const row = document.querySelector('.ready-system-row[data-system="msp-size"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateMspConfirmState();
    });
  });

  // Regions (multi)
  mspRegionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-region');
      const idx = state.regionsServed.indexOf(val);
      if (idx === -1) {
        state.regionsServed.push(val);
        chip.setAttribute('data-active', 'true');
        chip.setAttribute('aria-pressed', 'true');
      } else {
        state.regionsServed.splice(idx, 1);
        chip.removeAttribute('data-active');
        chip.removeAttribute('aria-pressed');
      }
      updateHidden('regions_served', state.regionsServed.join('; '));
      recordEvent('msp_region_toggled', { region: val, active: idx === -1 });
      // Mark system row as complete if at least one selected
      const row = document.querySelector('.ready-system-row[data-system="msp-regions"]');
      if (row) row.setAttribute('data-complete', state.regionsServed.length > 0 ? 'true' : 'false');
      updateMspConfirmState();
    });
  });

  // White-label (single yes/no)
  mspWhiteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.whiteLabelRequired = btn.getAttribute('data-val') || '';
      mspWhiteBtns.forEach(b => { b.removeAttribute('data-active'); b.removeAttribute('aria-pressed'); });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      updateHidden('white_label_required', state.whiteLabelRequired);
      recordEvent('msp_whitelabel_selected', { value: state.whiteLabelRequired });
      // Mark system row as complete
      const row = document.querySelector('.ready-system-row[data-system="msp-whitelabel"]');
      if (row) row.setAttribute('data-complete', 'true');
      updateMspConfirmState();
    });
  });

  function updateMspConfirmState() {
    if (!mspConfirm) return;
    const offersOk = (state.mspOffers || []).length > 0;
    const sizeOk = Boolean(state.targetCustomerSize);
    const regionsOk = (state.regionsServed || []).length > 0;
    const whiteLabelOk = Boolean(state.whiteLabelRequired);
    setButtonState(mspConfirm, offersOk && sizeOk && regionsOk && whiteLabelOk);
  }

  function updateAdvisorConfirmState() {
    if (!advisorConfirm) return;
    const focusOk = (state.advisorFocus || []).length > 0;
    const sizeOk = Boolean(state.targetCustomerSize);
    const regionsOk = (state.regionsServed || []).length > 0;
    const cobrandOk = Boolean(state.coBrandRequired);
    setButtonState(advisorConfirm, focusOk && sizeOk && regionsOk && cobrandOk);
  }

  mspConfirm?.addEventListener('click', (e) => {
    e.preventDefault();
    if (mspConfirm.disabled) return;
    recordEvent('msp_persona_confirmed', {
      offers: (state.mspOffers || []).join(','),
      size: state.targetCustomerSize,
      regions: (state.regionsServed || []).join(','),
      white_label: state.whiteLabelRequired
    });
    // Submit to HubSpot before advancing
    submitToHubSpot();
    // Auto-advance to Stage 2
    recordEvent('journey_persona_confirmed');
    unlockStage(3);
    setCurrentStage('mission-goal');
    setRevealed('mission-goal', true);
    temporarilyUnlockAndScroll('#mission-goal');
  });

  advisorConfirm?.addEventListener('click', (e) => {
    e.preventDefault();
    if (advisorConfirm.disabled) return;
    recordEvent('advisor_persona_confirmed', {
      focus: (state.advisorFocus || []).join(','),
      size: state.targetCustomerSize,
      regions: (state.regionsServed || []).join(','),
      cobrand: state.coBrandRequired
    });
    submitToHubSpot();
    recordEvent('journey_persona_confirmed');
    unlockStage(2);
    setCurrentStage('mission-goal');
    setRevealed('mission-goal', true);
    temporarilyUnlockAndScroll('#mission-goal');
  });

  // ============================================
  // OPT-IN FLOAT BUTTON
  // ============================================
  // Show button after scrolling past hero section
  const optinFloat = document.getElementById('optin-float');
  const optinBtn = document.getElementById('optin-btn');
  const heroSection = document.getElementById('mission-hero');

  function checkOptinVisibility() {
    if (!optinFloat || !heroSection) return;
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    const scrolled = window.scrollY;

    if (scrolled > heroBottom - 200) {
      optinFloat.classList.add('visible');
    } else {
      optinFloat.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', checkOptinVisibility, { passive: true });
  checkOptinVisibility(); // Check on load

  // Handle opt-in button click
  optinBtn?.addEventListener('click', () => {
    // Open email modal for opt-in
    setOverlay(true);
    recordEvent('optin_button_clicked');

    // Store that this is an opt-in flow (not a CTA flow)
    pendingCta = { ctaId: 'optin', label: 'Subscribe to Updates', href: null };
    
    // Set subscribe flag to 'yes' for HubSpot form
    state.subscribeForUpdates = 'yes';
    updateHidden('subscribe_for_updates', 'yes');
  });
})();
