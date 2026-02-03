/**
 * MSP Scrollable Landing Page - Journey Orchestrator
 * Handles persona/goal selection, telemetry, story rendering, and CTA gating
 */

// Initialize Lucide Icons
function refreshIcons() {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', refreshIcons);
} else {
  refreshIcons();
}

// Journey Orchestrator
(function() {
      const stageIds = ['mission-hero', 'mission-persona', 'mission-goal', 'mission-story', 'mission-cta'];
      const state = {
        persona: null,
        goal: null,
        pain: null,
        priority: 70,
        cta: null,
        email: null,
        unlockedIndex: 0,
        currentStage: stageIds[0]
      };
      let scrollLocked = false;

      const personaConfig = {
        msp: {
          label: 'Managed Service Provider',
          short: 'MSP',
          telemetry: 'Multi-tenant command center engaged. Automation-first revenue motions unlocked.',
          subtext: 'We’ll emphasize automation, recurring revenue, and managed service packaging built for MSP operators.',
          hero: 'Scaling monthly services, defending margin, and embedding automation narratives.'
        },
        var: {
          label: 'Value Added Reseller',
          short: 'VAR',
          telemetry: 'Solution aggregation detected. Deal velocity accelerators warming.',
          subtext: 'We’ll focus on packaged offers, enablement, and co-sell motions that boost margin for resellers.',
          hero: 'Combining distribution access with turnkey service plays and field alignment.'
        },
        distributor: {
          label: 'Distributor',
          short: 'Distributor',
          telemetry: 'Ecosystem signal received. Marketplace amplification online.',
          subtext: 'Expect partner enablement frameworks, merchandising plays, and automation at scale.',
          hero: 'Empowering wide partner ecosystems with scalable enablement and demand generation.'
        },
        si: {
          label: 'System Integrator',
          short: 'SI',
          telemetry: 'Enterprise integration path synced. Transformation playbooks loading.',
          subtext: 'We’ll lean into lifecycle orchestration, outcome-based services, and enterprise alignment.',
          hero: 'Orchestrating complex deployments with lifecycle delivery and executive alignment.'
        }
      };

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
        var: {
          recurring: [
            'Margin plan: add +10 pts recurring margin in 90 days.',
            'Levers: bundled subscriptions, service add‑ons, financing options.',
            'KPI: blended gross margin and renewal rate.'
          ],
          services: [
            'Goal: white‑label offers live in 30 days.',
            'Levers: offer canvas, pricing toolkit, sales enablement pack.',
            'KPI: partner-ready assets adopted by field.'
          ],
          retention: [
            'Outcome: standardized renewals and QBRs across accounts.',
            'Levers: playbooks, dashboards, automated comms.',
            'KPI: renewal cycle time −25%.'
          ],
          cosell: [
            'Motion: joint territory plan with 2 MDF campaigns.',
            'Levers: co-branded collateral, shared signals, escalation path.',
            'KPI: sourced pipeline from alliances.'
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

      const goalConfig = {
        recurring: {
          label: 'Grow recurring revenue',
          descriptor: 'Subscription playbooks, pricing accelerators, and automation loops that expand MRR.',
          telemetry: 'Recurring revenue engines fueled.',
          sliderLegend: 'Subscription surge level'
        },
        services: {
          label: 'Launch managed services',
          descriptor: 'Offer creation kits, deployment runbooks, and go-live enablement sequences.',
          telemetry: 'Managed service launch countdown initiated.',
          sliderLegend: 'Go-live readiness'
        },
        retention: {
          label: 'Strengthen client retention',
          descriptor: 'Experience metrics, QBR automations, and lifecycle marketing cadences.',
          telemetry: 'Customer retention safeguards in motion.',
          sliderLegend: 'Advocacy momentum'
        },
        cosell: {
          label: 'Accelerate co-sell velocity',
          descriptor: 'Marketplace placements, shared pipeline views, and field activation kits.',
          telemetry: 'Co-sell velocity boosters engaged.',
          sliderLegend: 'Joint motion intensity'
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

      const storyDeck = {
        recurring: [
          {
            title: 'Recurring Revenue Lab',
            badge: 'Subscription Flywheel',
            stat: '+28% avg MRR lift',
            icon: 'gauge',
            copy: persona => `Design subscription bundles crafted for ${persona.short} clients. Bundle telemetry, usage analytics, and premium support tiers to make renewals automatic.`
          },
          {
            title: 'Automation Mesh',
            badge: 'Service Automation',
            stat: '18 hrs saved / month',
            icon: 'circuit-board',
            copy: persona => `Trigger onboarding, ticket routing, and health scoring automatically so your team focuses on strategic upsell moments.`
          },
          {
            title: 'Value Narrative Engine',
            badge: 'Executive Ready',
            stat: '4 curated QBR stories',
            icon: 'presentation',
            copy: persona => `Deliver outcome dashboards and proof points aligned to the way ${persona.short} buyers justify budget.`
          }
        ],
        services: [
          {
            title: 'Offer Foundry',
            badge: 'Launch Blueprint',
            stat: 'Launch in 30 days',
            icon: 'factory',
            copy: persona => `Package services with ready-made positioning, pricing calculators, and co-brandable collateral for your ${persona.short} sellers.`
          },
          {
            title: 'Deployment Playbooks',
            badge: 'Field Enablement',
            stat: '12 repeatable runs',
            icon: 'map',
            copy: persona => `Standardize kickoff, implementation, and success rituals so every engagement feels orchestrated.`
          },
          {
            title: 'Signal Amplifier',
            badge: 'Demand Motion',
            stat: '+3x launch reach',
            icon: 'megaphone',
            copy: persona => `Activate launch campaigns, webinars, and nurture workflows pre-wired for your ${persona.short} ecosystem.`
          }
        ],
        retention: [
          {
            title: 'Experience Command',
            badge: 'Customer Insight',
            stat: 'Real-time health scoring',
            icon: 'heartbeat',
            copy: persona => `Surface usage, sentiment, and risk signals so your ${persona.short} teams can intervene before churn hits.`
          },
          {
            title: 'Advocacy Loop',
            badge: 'Lifecycle Motion',
            stat: '90-day renew template',
            icon: 'loop',
            copy: persona => `Automate QBRs, renewal cadences, and cross-sell prompts tailored to executive personas.`
          },
          {
            title: 'Success Studio',
            badge: 'Proof Engine',
            stat: '6 reference stories',
            icon: 'trophy',
            copy: persona => `Turn retention wins into case assets and customer marketing for the entire ${persona.short} roster.`
          }
        ],
        cosell: [
          {
            title: 'Co-Sell Hub',
            badge: 'Shared Pipeline',
            stat: 'One view, all partners',
            icon: 'infinity',
            copy: persona => `Give sellers a unified cockpit with co-branded offers, deal registration, and shared forecasting.`
          },
          {
            title: 'Launch Pad',
            badge: 'Marketplace Motion',
            stat: '+200% listing traffic',
            icon: 'rocket',
            copy: persona => `Optimize marketplace placements with curated messaging, visuals, and offer sequencing for ${persona.short} allies.`
          },
          {
            title: 'Field Fusion',
            badge: 'Activation Kit',
            stat: '3 partner plays',
            icon: 'users-round',
            copy: persona => `Equip partner managers with enablement agendas, MDF campaigns, and executive-ready battlecards.`
          }
        ]
      };

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
        var: {
          recurring: {
            headline: 'Grow recurring margin with packaged offers',
            subhead: 'Align product, services, and financing in one blueprint built for VAR teams.',
            primary: { label: 'Co-design margin play', url: '#', id: 'codesign_margin_play' },
            secondary: [
              { label: 'Download bundle canvas', url: '#', id: 'download_bundle_canvas' },
              { label: 'Enable sellers in 30 mins', url: '#', id: 'enable_sellers_session' }
            ]
          },
          services: {
            headline: 'Launch white-label managed services',
            subhead: 'Stand up offers your sellers can position tomorrow with ready-to-go collateral.',
            primary: { label: 'Launch co-branded service', url: '#', id: 'launch_cobranded_service' },
            secondary: [
              { label: 'Grab sales battlecard', url: '#', id: 'grab_sales_battlecard' },
              { label: 'Meet solution specialist', url: '#', id: 'meet_solution_specialist' }
            ]
          },
          retention: {
            headline: 'Lock in client loyalty post-sale',
            subhead: 'Automate adoption programs and executive reporting for your resale customers.',
            primary: { label: 'Activate customer success kit', url: '#', id: 'activate_customer_success' },
            secondary: [
              { label: 'Access renewal cadence map', url: '#', id: 'access_renewal_map' },
              { label: 'Book executive briefing', url: '#', id: 'book_executive_briefing' }
            ]
          },
          cosell: {
            headline: 'Move faster with co-sell alliances',
            subhead: 'Unlock joint pipeline visibility and MDF campaigns tailored to your territory.',
            primary: { label: 'Plan a Co-Sell Sprint', url: '#', id: 'plan_cosell_sprint' },
            secondary: [
              { label: 'Download alliance kit', url: '#', id: 'download_alliance_kit' },
              { label: 'Register joint campaign', url: '#', id: 'register_joint_campaign' }
            ]
          }
        },
        distributor: {
          recurring: {
            headline: 'Enable partners for monthly revenue',
            subhead: 'Give partners pricing, collateral, and incentives to drive subscription renewals.',
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
        storyIntro: document.getElementById('story-intro'),
        storyCards: document.getElementById('mission-story-cards'),
        ctaHeadline: document.getElementById('cta-headline'),
        ctaSubhead: document.getElementById('cta-subhead'),
        ctaGrid: document.getElementById('cta-grid'),
        ctaFootnote: document.getElementById('cta-footnote')
      };

      // Email overlay elements
      const emailOverlay = document.getElementById('email-overlay');
      const emailInput = document.getElementById('email-input');
      const emailConfirm = document.getElementById('email-confirm');
      const emailCancel = document.getElementById('email-cancel');
      const emailError = document.getElementById('email-error');

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

        // Initialize at center
        const c = getCenter();
        setPos(c.x, c.y);

        hero.addEventListener('pointermove', onMove, { passive: true });
        hero.addEventListener('touchmove', onMove, { passive: true });
        hero.addEventListener('mouseleave', () => { pointerActive = false; });
        drift();

        // Clean up if needed (not strictly necessary on this page)
        window.addEventListener('beforeunload', () => cancelAnimationFrame(rafId));
      }

      const hiddenFields = {
        partner: document.querySelector('input[name="journey_partner_type"]'),
        goal: document.querySelector('input[name="journey_goal"]'),
        pain: document.querySelector('input[name="journey_pain_point"]'),
        priority: document.querySelector('input[name="journey_priority"]'),
        stage: document.querySelector('input[name="journey_completion_stage"]'),
        cta: document.querySelector('input[name="journey_cta_selected"]'),
        email: document.querySelector('input[name="journey_email"]')
      };

      const missionForm = document.getElementById('journey-sync-form');

      const personaButtons = Array.from(document.querySelectorAll('.persona-badge'));
      const goalButtons = Array.from(document.querySelectorAll('.goal-toggle'));
      const painButtons = Array.from(document.querySelectorAll('.pain-chip'));
      const progressDock = document.querySelector('.progress-dock');
      const progressPills = Array.from(document.querySelectorAll('.progress-pill'));

      const prioritySlider = document.getElementById('priority-slider');
      const beginMission = document.getElementById('begin-mission');
      const storyAdvance = document.getElementById('story-advance');
      const personaConfirm = document.getElementById('persona-confirm');
      const goalConfirm = document.getElementById('goal-confirm');

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
        if (el) el.setAttribute('data-revealed', revealed ? 'true' : 'false');
      }

      // Backwards-compatible helper now that scroll is not locked
      function temporarilyUnlockAndScroll(selector) {
        scrollToStage(selector);
      }


      function stageIndex(id) {
        return stageIds.indexOf(id);
      }

      function updateHiddenStage() {
        if (hiddenFields.stage) hiddenFields.stage.value = state.currentStage;
      }

      function updateProgressDock() {
        if (!progressDock) return;
        if (state.currentStage === 'mission-hero') {
          progressDock.setAttribute('data-visibility', 'hidden');
        } else {
          progressDock.setAttribute('data-visibility', 'visible');
        }
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
          state.unlockedIndex = targetIndex;
          updateProgressPills();
        }
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

      function updateTelemetry(message) {
        if (!elements.telemetry) return;
        const entry = document.createElement('div');
        entry.className = 'rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-100 transition-opacity duration-500 opacity-0 telemetry-entry';
        entry.textContent = message;
        elements.telemetry.prepend(entry);
        requestAnimationFrame(() => {
          entry.classList.remove('opacity-0');
        });
      }

      // Replace feed with relevant entries based on current selections
      function setTelemetry(messages = []) {
        if (!elements.telemetry) return;
        elements.telemetry.innerHTML = '';
        messages.forEach(msg => {
          const entry = document.createElement('div');
          entry.className = 'rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-100 transition-opacity duration-500 opacity-0 telemetry-entry';
          entry.textContent = msg;
          elements.telemetry.appendChild(entry);
          requestAnimationFrame(() => {
            entry.classList.remove('opacity-0');
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
          messages.push(`Obstacle: ${pain.label} — ${pain.detail}`);
        }
        if (g) {
          messages.push(`Objective: ${g.label} — ${g.descriptor}`);
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

        // Proof point from the first storyboard card for the selected goal
        const firstCard = state.goal && storyDeck[state.goal] ? storyDeck[state.goal][0] : null;
        if (firstCard && firstCard.stat) {
          messages.push(`Proof point: ${firstCard.stat}`);
        }

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

      function applyPersona(key, autoScroll = false) {
        if (!personaConfig[key]) return;
        state.persona = key;
        personaButtons.forEach(btn => {
          const active = btn.getAttribute('data-persona') === key;
          btn.setAttribute('data-active', active ? 'true' : 'false');
        });

        const persona = personaConfig[key];
        if (elements.personaReadout) elements.personaReadout.textContent = persona.label;
        if (elements.personaSubtext) elements.personaSubtext.textContent = persona.subtext;
        if (elements.personaSignal) elements.personaSignal.textContent = persona.telemetry;
        if (elements.heroSummary) elements.heroSummary.textContent = persona.hero;
        if (elements.goalIntro) elements.goalIntro.textContent = `Console is tuned for ${persona.short} operators. Pick your destination.`;
        renderTelemetryFeed();
        updateHidden('partner', persona.label);
        saveState();
        refreshIcons();
        recordEvent('journey_persona_selected');
        setButtonState(personaConfirm, true);
        unlockStage(1);
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
        if (!goalConfig[key]) return;
        state.goal = key;
        goalButtons.forEach(btn => {
          const active = btn.getAttribute('data-goal') === key;
          btn.setAttribute('data-active', active ? 'true' : 'false');
        });

        const goal = goalConfig[key];
        if (elements.consoleReadout) elements.consoleReadout.textContent = goal.label;
        if (elements.consoleSubtext) elements.consoleSubtext.textContent = goal.descriptor;
        if (elements.goalSignal) elements.goalSignal.textContent = goal.telemetry;
        if (elements.storyIntro && state.persona) {
          const persona = personaConfig[state.persona];
          elements.storyIntro.textContent = `${persona.short} storyboards now tuned for ${goal.label.toLowerCase()}. Use them to brief leadership or train your field teams.`;
        }
        renderTelemetryFeed();
        updateHidden('goal', goal.label);
        saveState();
        refreshIcons();
        recordEvent('journey_goal_selected');
        setButtonState(goalConfirm, Boolean(state.goal && state.pain));
      }

      function applyPain(key, autoScroll = false) {
        if (!painConfig[key]) return;
        state.pain = key;
        painButtons.forEach(btn => {
          const active = btn.getAttribute('data-pain') === key;
          btn.setAttribute('data-active', active ? 'true' : 'false');
        });

        const pain = painConfig[key];
        renderTelemetryFeed();
        if (elements.goalSignal) {
          elements.goalSignal.textContent = `${pain.detail} Noted. We’ll weave this into your course correction.`;
        }
        updateHidden('pain', pain.label);
        saveState();
        recordEvent('journey_pain_selected');
        setButtonState(goalConfirm, Boolean(state.goal && state.pain));
      }

      function renderStory() {
        if (!state.goal || !storyDeck[state.goal] || !elements.storyCards) {
          elements.storyCards.innerHTML = '';
          return;
        }
        const persona = personaConfig[state.persona] || { short: 'partner' };
        const cards = storyDeck[state.goal]
          .map((card, index) => {
            const body = typeof card.copy === 'function' ? card.copy(persona) : card.copy;
            const ctaConfig = (ctaMatrix[state.persona] && ctaMatrix[state.persona][state.goal]) || null;
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
                <h3 class="text-2xl font-semibold mt-5">${card.title}</h3>
                <p class="text-slate-300/85 mt-4 text-sm leading-relaxed">${body}</p>
                <div class="story-aux">
                  <div class="story-aux-label">${card.badge}</div>
                  <div class="story-aux-value">${nextValue}</div>
                </div>
                <div class="story-proof">
                  <div class="story-proof-label">PROOF</div>
                  <div class="story-proof-value">${card.stat}</div>
                </div>
                <div class="absolute top-6 right-6 text-xs uppercase tracking-[0.3em] text-slate-400/80">0${index + 1}</div>
              </article>`;
          })
          .join('');
        elements.storyCards.innerHTML = cards;
        refreshIcons();

        // Ensure hover-reveal works consistently via attribute toggle
        elements.storyCards.querySelectorAll('.story-card').forEach(card => {
          const on = () => card.setAttribute('data-hover', '1');
          const off = () => card.removeAttribute('data-hover');
          card.addEventListener('mouseenter', on);
          card.addEventListener('mouseleave', off);
          card.addEventListener('focusin', on);
          card.addEventListener('focusout', off);
        });
      }

      function renderCtas() {
        if (!state.persona || !state.goal || !ctaMatrix[state.persona]) return;
        const config = ctaMatrix[state.persona][state.goal];
        if (!config) return;

        if (elements.ctaHeadline) elements.ctaHeadline.textContent = config.headline;
        if (elements.ctaSubhead) elements.ctaSubhead.textContent = config.subhead;

        if (elements.ctaGrid) {
          const secondaryButtons = (config.secondary || []).map(item => `
            <a href="${item.url}" data-variant="secondary" data-cta-id="${item.id}">
              <i data-lucide="arrow-right" class="w-5 h-5"></i>
              <span>${item.label}</span>
            </a>`).join('');

          elements.ctaGrid.innerHTML = `
            <a href="${config.primary.url}" data-variant="primary" data-cta-id="${config.primary.id}">
              <i data-lucide="sparkles" class="w-5 h-5"></i>
              <span>${config.primary.label}</span>
            </a>
            ${secondaryButtons}`;
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
        recordEvent('journey_cta_clicked', { cta: ctaId });

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
                scrollToStage(`#${allowedStage}`);
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

      beginMission?.addEventListener('click', () => {
        recordEvent('journey_begin_clicked');
        unlockStage(1);
        setCurrentStage('mission-persona');
        setRevealed('mission-persona', true);
        temporarilyUnlockAndScroll('#mission-persona');
      });

      personaConfirm?.addEventListener('click', () => {
        if (!state.persona) return;
        const persona = personaConfig[state.persona];
        if (elements.personaSignal && persona) {
          elements.personaSignal.textContent = `${persona.label} confirmed. Trajectory console is ready.`;
        }
        updateTelemetry(`${persona.label} mission confirmed. Advancing to trajectory.`);
        recordEvent('journey_persona_confirmed');
        unlockStage(2);
        setCurrentStage('mission-goal');
        setRevealed('mission-goal', true);
        temporarilyUnlockAndScroll('#mission-goal');
      });

      personaButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-persona');
          applyPersona(key);
        });
      });

      goalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-goal');
          applyGoal(key);
          if (state.pain) {
            renderStory();
            renderCtas();
          }
        });
      });

      goalConfirm?.addEventListener('click', () => {
        if (!state.goal || !state.pain) return;
        const goal = goalConfig[state.goal];
        if (elements.goalSignal && goal) {
          elements.goalSignal.textContent = `${goal.label} locked. Storyboard is generating.`;
        }
        updateTelemetry(`${goal.label} course confirmed. Storyboard spinning up.`);
        recordEvent('journey_goal_confirmed');
        unlockStage(3);
        renderStory();
        renderCtas();
        setCurrentStage('mission-story');
        setRevealed('mission-story', true);
        temporarilyUnlockAndScroll('#mission-story');
      });

      painButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-pain');
          applyPain(key);
          if (state.goal) {
            renderStory();
            renderCtas();
          }
        });
      });

      prioritySlider?.addEventListener('input', event => {
        state.priority = Number(event.target.value);
        renderPriority();
        saveState();
        recordEvent('journey_priority_adjusted', { priority: state.priority });
      });

      storyAdvance?.addEventListener('click', () => {
        recordEvent('journey_story_confirmed');
        unlockStage(4);
        renderCtas();
        setCurrentStage('mission-cta');
        updateTelemetry('Mission storyboard approved. Launch actions ready.');
        setRevealed('mission-cta', true);
        temporarilyUnlockAndScroll('#mission-cta');
      });

      elements.ctaGrid?.addEventListener('click', handleCtaClick);

      // Email overlay interactions
      emailConfirm?.addEventListener('click', () => {
        if (!emailInput) return;
        const val = emailInput.value.trim();
        if (!validEmail(val)) {
          if (emailError) emailError.style.display = 'block';
          return;
        }
        state.email = val;
        updateHidden('email', val);
        recordEvent('journey_email_captured');
        setOverlay(false);
        if (pendingCta) {
          const { ctaId, label, href } = pendingCta;
          pendingCta = null;
          finalizeCta(ctaId, label, href);
        }
      });

      emailCancel?.addEventListener('click', () => {
        setOverlay(false);
        pendingCta = null;
      });

      emailInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          emailConfirm?.click();
        }
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

      observeStages();
      renderPriority();
      loadState();
      setButtonState(personaConfirm, Boolean(state.persona));
      setButtonState(goalConfirm, Boolean(state.goal && state.pain));
      updateHiddenStage();
      updateProgressDock();
      updateProgressPills();
      refreshIcons();
      initHeroSpotlight();
    })();
