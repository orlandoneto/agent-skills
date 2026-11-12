/**
 * Gera skills/ontoom/<id>/SKILL.md para o pack SEO/Link Building (100 ideias).
 * Pula se já existir id/name equivalente no catálogo ou pasta.
 *
 *   node scripts/seed-seo-linkbuilding-pack.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listSkillDirs, normalizeName } from "./lib/gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ontoomRoot = path.join(root, "skills", "ontoom");

/** @type {{ id: string, title: string, goal: string, inputs: string, steps: string[], output: string, tags: string[] }[]} */
const PACK = [
  { id: "haro-connectively-responder", title: "HARO / Connectively responder", goal: "Draft short, citable answers to journalist queries based on the user's expertise.", inputs: "Topic expertise notes + journalist question (or HARO dump)", steps: ["Extract the question and deadline", "Match claims the user can verify", "Write a 80–150 word quotable answer with one proof point", "Add a one-line bio + optional link"], output: "Ready-to-paste reply + optional subject line", tags: ["seo", "pr", "outreach"] },
  { id: "broken-link-finder", title: "Broken link finder", goal: "Find broken links on niche sites and propose the user's content as a replacement.", inputs: "Niche keywords + user's target URL(s)", steps: ["Suggest Google operators / crawl targets for resource pages", "List candidate pages likely to have outbound links", "For each hit, note 404/outdated link and suggested replacement anchor", "Draft a polite outreach email"], output: "Markdown/CSV table: page, broken URL, replacement, email draft", tags: ["seo", "link-building"] },
  { id: "skyscraper-opportunity-scout", title: "Skyscraper opportunity scout", goal: "Find ranking pages with many backlinks and list ways to make a 10x better asset.", inputs: "Seed keyword or competitor URL", steps: ["Outline the top page structure and angles", "List content gaps, outdated data, weak media", "Propose a superior outline with unique assets", "List who likely linked to the original for outreach"], output: "Brief: gaps, outline, outreach target types", tags: ["seo", "content", "link-building"] },
  { id: "unlinked-brand-mentions", title: "Unlinked brand mentions", goal: "Find brand/product mentions without links and draft link-request emails.", inputs: "Brand names + aliases + known domains", steps: ["Propose search queries for unlinked mentions", "Classify mention type (news, forum, review)", "Prioritize by authority and relevance", "Draft personalized ask-for-link emails"], output: "Prioritized list + email templates", tags: ["seo", "outreach"] },
  { id: "resource-page-prospector", title: "Resource page prospector", goal: "Find 'useful links' / resource pages in a niche via advanced search operators.", inputs: "Niche + optional geo", steps: ["Build operator queries (intitle:resources, inurl:links, etc.)", "Filter for editorial/resource pages", "Score relevance and linkability", "Draft pitch offering the user's resource"], output: "Prospect list with queries used + pitch draft", tags: ["seo", "link-building"] },
  { id: "podcast-guest-matcher", title: "Podcast guest matcher", goal: "Find niche podcasts that accept guests and draft pitches for show-note links.", inputs: "Niche + speaker bio + talking points", steps: ["List search queries for guest-friendly shows", "Note submission rules if visible", "Match episodes to user's expertise", "Write personalized pitch + 3 episode ideas"], output: "Shows table + pitch pack", tags: ["pr", "outreach"] },
  { id: "competitor-link-intersect", title: "Competitor link intersect", goal: "Find sites linking to multiple competitors but not the user.", inputs: "3 competitor domains + user domain + optional backlink CSVs", steps: ["If CSVs provided, compute intersection of referring domains", "If not, describe how to export from Ahrefs/Moz/Semrush/DataForSEO", "Exclude user domain and low-quality noise", "Prioritize editorial opportunities"], output: "Intersect list ranked by opportunity", tags: ["seo", "link-building"] },
  { id: "edu-gov-link-finder", title: "Edu/gov link finder", goal: "Identify .edu/.gov partnership, scholarship, or resource link opportunities.", inputs: "Niche + brand assets (scholarship, data, toolkit)", steps: ["Build site:.edu / site:.gov operator ideas", "Classify opportunity type", "Note compliance risks (no spammy tactics)", "Draft appropriate outreach"], output: "Opportunity list + compliant pitches", tags: ["seo", "link-building"] },
  { id: "infographic-pitch-generator", title: "Infographic pitch generator", goal: "Find blogs that publish visuals and pitch exclusive infographics for credit links.", inputs: "Topic + data points + target URL", steps: ["Outline a unique data visual concept", "Suggest prospect types that embed visuals", "Write pitch emphasizing exclusivity and embed code", "List attribution requirements"], output: "Concept brief + pitch email", tags: ["seo", "outreach"] },
  { id: "roundup-post-finder", title: "Roundup post finder", goal: "Find expert-roundup posts and prepare applications for future editions.", inputs: "Niche + expert bio + unique tip", steps: ["Build queries for roundup/expert-answers posts", "Note recurring series vs one-offs", "Draft a concise contribution tip", "Prepare bio + headshot link placeholders"], output: "Targets + contribution draft", tags: ["seo", "outreach"] },
  { id: "image-reclamation-bot", title: "Image reclamation", goal: "Locate sites using the user's images without credit and request attribution/links.", inputs: "Image URLs or reverse-search notes + preferred credit format", steps: ["Guide reverse image search process", "Classify fair use vs clear reuse", "Draft attribution or removal requests", "Track preferred credit HTML"], output: "Cases list + request templates", tags: ["seo", "outreach"] },
  { id: "local-citation-builder", title: "Local citation builder", goal: "List local directories, associations, and guides for local SEO citations.", inputs: "Business NAP + category + city", steps: ["List priority citation sources by country/city", "Check NAP fields to submit consistently", "Flag duplicates/inconsistencies if data given", "Order by impact for local pack"], output: "Citation checklist with NAP fields", tags: ["seo", "local"] },
  { id: "niche-edit-prospector", title: "Niche edit prospector", goal: "Find aged indexed articles where a contextual link to the user's guide adds value.", inputs: "Target guide URL + niche keywords", steps: ["Find topical articles with resource sections", "Suggest exact paragraph/context for the link", "Assess relevance (no irrelevant insertions)", "Draft value-first outreach"], output: "Prospects with suggested anchor + context", tags: ["seo", "link-building"] },
  { id: "digital-pr-angle-creator", title: "Digital PR angle creator", goal: "Turn internal data into newsworthy angles that attract editorial links.", inputs: "Raw stats / survey / product data", steps: ["Find surprising, timely, or local angles", "Propose headline + lede + methodology note", "List journalist/blogger targets by beat", "Draft a short pitch"], output: "3–5 PR angles + pitch pack", tags: ["pr", "link-building"] },
  { id: "testimonial-link-swap", title: "Testimonial link swap", goal: "Identify tools the user already uses and draft testimonials in exchange for a homepage/customers link.", inputs: "List of tools/vendors used + outcomes", steps: ["Prioritize vendors with customer/logo pages", "Write authentic testimonial with metrics if available", "Ask politely for a dofollow/nofollow-as-appropriate credit link", "Avoid fake claims"], output: "Vendor list + testimonial drafts", tags: ["outreach", "link-building"] },
  { id: "cold-outreach-personalizer", title: "Cold outreach personalizer", goal: "Read a prospect's recent posts and write a highly personalized outreach email.", inputs: "Prospect URL/blog + user's ask + asset", steps: ["Summarize 2–3 recent pieces", "Tie the ask to a specific paragraph or gap", "Write short personalized email (no fluff)", "Offer clear mutual value"], output: "Email draft + personalization notes", tags: ["outreach"] },
  { id: "follow-up-sequence-writer", title: "Follow-up sequence writer", goal: "Create a polite 3-email follow-up cadence for non-responders.", inputs: "Original email + ask + value prop", steps: ["Write day-3, day-7, day-14 follow-ups", "Vary angle (value, social proof, soft close)", "Keep each under 90 words", "Never guilt-trip"], output: "3 follow-up emails with timing", tags: ["outreach"] },
  { id: "outreach-subject-line-tester", title: "Outreach subject line tester", goal: "Generate high-open subject lines that avoid spam triggers.", inputs: "Campaign goal + niche", steps: ["Generate 10 subject variants", "Flag spammy words/punctuation", "Score clarity vs curiosity", "Recommend A/B pairs"], output: "10 subjects with notes", tags: ["outreach", "email"] },
  { id: "editor-persona-analyzer", title: "Editor persona analyzer", goal: "Match guest-post pitch tone to a publisher's editorial voice.", inputs: "Publisher about/guidelines + sample articles", steps: ["Extract tone, audience, taboo topics", "List preferred formats", "Rewrite pitch to match voice", "Suggest 3 on-brief titles"], output: "Persona card + adapted pitch", tags: ["outreach", "content"] },
  { id: "negotiation-reply-assistant", title: "Negotiation reply assistant", goal: "Respond to paid-link requests by negotiating organic value or declining safely.", inputs: "Inbound offer + user's policy", steps: ["Classify offer (sponsored, niche edit fee, exchange)", "Draft compliant reply options", "Propose alternatives (guest post, co-marketing, nofollow disclosure)", "Never advise black-hat cloaking"], output: "2–3 reply options", tags: ["outreach"] },
  { id: "linkedin-outreach-connector", title: "LinkedIn outreach connector", goal: "Turn email pitches into short LinkedIn messages for editors.", inputs: "Email pitch + prospect role", steps: ["Compress to 300–500 characters", "Lead with specific compliment/value", "One clear CTA", "Optional connection-note variant"], output: "Connection note + message", tags: ["outreach"] },
  { id: "journalist-pitch-compressor", title: "Journalist pitch compressor", goal: "Compress long PR copy into a 3-paragraph newsroom pitch.", inputs: "Long brief / press release", steps: ["Keep news hook in paragraph 1", "Proof + data in paragraph 2", "Offer interview/assets in paragraph 3", "Add subject line"], output: "Compressed pitch", tags: ["pr"] },
  { id: "spam-trigger-checker", title: "Spam trigger checker", goal: "Review outreach templates and remove spam-filter triggers.", inputs: "Email template(s)", steps: ["Flag trigger words, ALL CAPS, excess links", "Check link/domain reputation notes", "Suggest cleaner wording", "Keep one clear CTA link"], output: "Annotated template + clean version", tags: ["email", "outreach"] },
  { id: "partnership-proposal-builder", title: "Partnership proposal builder", goal: "Structure co-marketing proposals that create natural authority exchange.", inputs: "Partner type + shared audience + assets", steps: ["Define mutual outcomes", "Propose formats (webinar, ebook, data study)", "Outline responsibilities and timeline", "Include link/mention expectations transparently"], output: "1-page partnership proposal", tags: ["pr", "outreach"] },
  { id: "thank-you-relationship-builder", title: "Thank-you relationship builder", goal: "Turn a one-off publication into a recurring partner with a thank-you note.", inputs: "Published URL + editor name", steps: ["Write short thank-you referencing the piece", "Offer a future exclusive angle", "Ask how to be helpful next time", "Optional social amplification draft"], output: "Thank-you + next-angle offer", tags: ["pr", "outreach"] },
  { id: "disavow-file-generator", title: "Disavow file generator", goal: "From a backlink spreadsheet, flag toxic domains and format a Google disavow .txt.", inputs: "Backlink export CSV + optional spam signals", steps: ["Define toxicity heuristics (irrelevant, hacked, PBN-like)", "Never disavow without evidence — mark uncertain as review", "Output domain: lines for high confidence only", "Explain residual risk"], output: "disavow.txt draft + review list", tags: ["seo", "risk"] },
  { id: "anchor-text-balancer", title: "Anchor text balancer", goal: "Analyze exact/partial/branded/generic anchors and warn about over-optimization.", inputs: "Anchor text export", steps: ["Bucket anchors", "Compute shares", "Flag risky exact-match spikes", "Recommend healthier targets"], output: "Distribution table + recommendations", tags: ["seo", "risk"] },
  { id: "link-velocity-monitor", title: "Link velocity monitor", goal: "Evaluate link gain/loss pace to spot anomalies or negative SEO.", inputs: "Monthly referring-domain history", steps: ["Plot/describe velocity", "Flag unnatural spikes/drops", "Separate lost vs new", "Suggest investigation steps"], output: "Velocity summary + alerts", tags: ["seo", "risk"] },
  { id: "pbn-footprint-detector", title: "PBN footprint detector", goal: "Spot private-blog-network footprints in prospect or backlink lists.", inputs: "Domain list + optional WHOIS/IP notes", steps: ["Look for shared templates, thin content, footprint patterns", "Score risk tiers", "Recommend avoid vs manual review", "Do not accuse without evidence"], output: "Risk-tiered domain list", tags: ["seo", "risk"] },
  { id: "lost-backlinks-recovery", title: "Lost backlinks recovery", goal: "Investigate recently lost links and draft recovery actions.", inputs: "Lost-link export", steps: ["Classify reason (404, redirected, removed, site down)", "Prioritize by value", "Draft recovery outreach or fix redirects", "Track status fields"], output: "Recovery plan table", tags: ["seo", "outreach"] },
  { id: "nofollow-dofollow-auditor", title: "Nofollow/dofollow auditor", goal: "Audit follow/nofollow/sponsored/ugc balance in a backlink profile.", inputs: "Backlink export with rel attributes", steps: ["Summarize rel distribution", "Interpret for brand vs SEO risk", "Note missing rel on paid placements", "Recommend healthy mix"], output: "Rel audit summary", tags: ["seo", "risk"] },
  { id: "tier2-link-prioritizer", title: "Tier-2 link prioritizer", goal: "Find strongest guest posts/assets that need supporting links.", inputs: "Published guest URLs + optional metrics", steps: ["Rank assets by relevance/traffic potential", "Suggest internal + external support tactics", "Avoid manipulative tier schemes — focus on editorial promotion", "List next actions"], output: "Prioritized amplification list", tags: ["seo", "link-building"] },
  { id: "redirect-chain-link-saver", title: "Redirect chain link saver", goal: "Find backlinks hitting old URLs stuck in redirect chains and fix destinations.", inputs: "Backlink URLs + redirect map", steps: ["Detect multi-hop 301 chains", "Propose final destination mapping", "Recommend updating links or shortening redirects", "Estimate equity leakage risk"], output: "Chain report + fix list", tags: ["seo", "technical"] },
  { id: "spam-score-triage", title: "Spam score triage", goal: "Triage thousands of backlinks by risk using quality and topical relevance.", inputs: "Large backlink export", steps: ["Bucket high/medium/low risk", "Separate review vs ignore vs disavow-candidates", "Explain heuristics used", "Cap actions to high-confidence"], output: "Triaged CSV/markdown buckets", tags: ["seo", "risk"] },
  { id: "competitor-spiking-alert", title: "Competitor spiking alert", goal: "Explain a sudden competitor link spike and extract replicable tactics.", inputs: "Competitor domain + spike window + sample new links", steps: ["Cluster new referring pages by type", "Identify campaigns (PR, tool, viral asset)", "Separate toxic vs editorial", "List ethical replication ideas"], output: "Spike analysis + playbook", tags: ["seo", "competitive"] },
  { id: "keyword-clustering-engine", title: "Keyword clustering engine", goal: "Cluster keywords by semantic similarity and search intent to avoid cannibalization.", inputs: "Keyword list (CSV)", steps: ["Group by intent and topic", "Pick primary URL per cluster", "Flag cannibalization risks", "Suggest content types"], output: "Cluster map with primary keywords", tags: ["seo", "keywords"] },
  { id: "zero-volume-gem-finder", title: "Zero-volume gem finder", goal: "Surface emerging long-tail questions before traditional tools show volume.", inputs: "Niche + forums/autocomplete notes", steps: ["Mine question patterns", "Score uniqueness vs competition", "Map to content formats", "Prioritize by business fit"], output: "Gem list with angles", tags: ["seo", "keywords"] },
  { id: "search-intent-classifier", title: "Search intent classifier", goal: "Classify keywords into informational, navigational, commercial, or transactional.", inputs: "Keyword list", steps: ["Label each term", "Note SERP pattern expectations", "Recommend page type", "Flag mixed-intent terms"], output: "Labeled keyword table", tags: ["seo", "keywords"] },
  { id: "people-also-ask-miner", title: "People Also Ask miner", goal: "Organize PAA-style questions into FAQ sections and snippet opportunities.", inputs: "Seed keyword + PAA list if available", steps: ["Deduplicate questions", "Map to H2/FAQ", "Draft concise answer blocks", "Suggest FAQ schema candidates"], output: "FAQ outline + answer drafts", tags: ["seo", "content"] },
  { id: "content-gap-matrix", title: "Content gap matrix", goal: "Compare competitor Top-10 keywords against the user's site coverage.", inputs: "Competitor keyword exports + user's URL inventory", steps: ["Find missing topics", "Score difficulty vs opportunity", "Suggest brief priorities", "Avoid duplicate existing coverage"], output: "Gap matrix prioritized", tags: ["seo", "content"] },
  { id: "seasonal-trend-forecaster", title: "Seasonal trend forecaster", goal: "Map seasonal search peaks to plan the editorial calendar ~3 months ahead.", inputs: "Niche + historical trend notes", steps: ["Identify seasonal peaks", "Back-calculate production deadlines", "Propose calendar slots", "Note evergreen vs seasonal assets"], output: "Seasonal calendar plan", tags: ["seo", "content"] },
  { id: "bofu-keyword-extractor", title: "BoFu keyword extractor", goal: "Filter bottom-of-funnel terms (comparisons, best X, alternatives) with conversion intent.", inputs: "Keyword list", steps: ["Filter BoFu patterns", "Group by product/job-to-be-done", "Recommend page templates", "Prioritize by commercial value"], output: "BoFu shortlist", tags: ["seo", "keywords"] },
  { id: "local-keyword-multiplier", title: "Local keyword multiplier", goal: "Combine services with neighborhoods/cities naturally for local SEO.", inputs: "Services + geo list", steps: ["Generate geo×service combos", "Avoid doorway spam — plan unique angles", "Suggest landing page structure", "Flag unnatural stuffing"], output: "Local keyword matrix + page plan", tags: ["seo", "local"] },
  { id: "question-to-topic-mapper", title: "Question-to-topic mapper", goal: "Turn raw forum questions into structured blog briefs.", inputs: "Reddit/Quora/forum dumps or notes", steps: ["Cluster questions", "Map to article titles", "Define audience pain", "Outline H2s"], output: "Topic briefs", tags: ["seo", "content"] },
  { id: "keyword-difficulty-reality-check", title: "Keyword difficulty reality check", goal: "Manually assess page-one competitiveness beyond a single KD score.", inputs: "Target keyword + SERP notes/screenshots", steps: ["Profile top results (DR, intent match, content depth)", "Estimate realistic chance", "Suggest supporting tactics or easier variants", "Decide go/hold"], output: "Go/no-go memo", tags: ["seo", "keywords"] },
  { id: "title-tag-ctr-optimizer", title: "Title tag CTR optimizer", goal: "Generate SEO titles within ~60 characters using clarity and curiosity.", inputs: "Primary keyword + page angle", steps: ["Generate 8–12 variants", "Check length and keyword placement", "Avoid clickbait mismatch", "Pick top 3 with rationale"], output: "Title candidates ranked", tags: ["seo", "on-page"] },
  { id: "meta-description-writer", title: "Meta description writer", goal: "Write persuasive meta descriptions (~155 chars) that improve SERP CTR.", inputs: "Page summary + keyword + CTA", steps: ["Write 3–5 variants", "Include benefit + CTA", "Respect length", "Match page language"], output: "Meta description set", tags: ["seo", "on-page"] },
  { id: "heading-hierarchy-auditor", title: "Heading hierarchy auditor", goal: "Audit H1–H4 structure for scanability and semantic logic.", inputs: "Article outline or HTML", steps: ["Check single H1", "Validate logical nesting", "Flag keyword stuffing in headings", "Propose revised outline"], output: "Heading audit + fixed outline", tags: ["seo", "on-page"] },
  { id: "semantic-nlp-enricher", title: "Semantic NLP enricher", goal: "List entities/related terms from top results missing from the user's draft.", inputs: "Draft + competitor notes", steps: ["Extract entities/topics competitors cover", "Mark missing must-haves vs nice-to-haves", "Suggest natural insertions", "Avoid stuffing"], output: "Enrichment checklist", tags: ["seo", "content"] },
  { id: "featured-snippet-formatter", title: "Featured snippet formatter", goal: "Rewrite key paragraphs into definition/list/table formats for position-zero potential.", inputs: "Target query + current paragraph", steps: ["Choose format matching SERP", "Write concise answer-first block", "Preserve accuracy", "Suggest supporting detail below"], output: "Snippet-ready block", tags: ["seo", "content"] },
  { id: "content-decay-reviver", title: "Content decay reviver", goal: "Revive aging posts that lost traffic with an update roadmap.", inputs: "URL + old metrics notes + current draft", steps: ["Diagnose decay causes", "List outdated sections", "Propose new data/sections", "Plan republish + internal links"], output: "Update brief", tags: ["seo", "content"] },
  { id: "cannibalization-resolver", title: "Cannibalization resolver", goal: "Detect pages competing for the same term and recommend merge or redirect.", inputs: "Keyword + candidate URLs", steps: ["Compare intent overlap", "Pick winner URL", "Recommend consolidate/redirect/differentiate", "Outline internal link changes"], output: "Resolution plan", tags: ["seo", "on-page"] },
  { id: "alt-text-accessibility-gen", title: "Alt text accessibility generator", goal: "Generate descriptive, SEO-aware alt text for article and ecommerce images.", inputs: "Image context list", steps: ["Write accurate alts", "Include keyword only if natural", "Keep concise", "Note decorative images"], output: "Alt text table", tags: ["seo", "accessibility"] },
  { id: "thin-content-expander", title: "Thin content expander", goal: "Expand thin underperforming pages into complete guides with useful subtopics.", inputs: "URL/draft + keyword", steps: ["Diagnose thinness", "Propose subtopics with intent", "Outline sections + FAQs", "Keep unique value vs competitors"], output: "Expansion outline", tags: ["seo", "content"] },
  { id: "readability-simplifier", title: "Readability simplifier", goal: "Simplify dense technical copy into short paragraphs without losing depth.", inputs: "Draft text", steps: ["Shorten sentences", "Replace jargon or define it", "Add scannable structure", "Preserve technical accuracy"], output: "Simplified rewrite", tags: ["content"] },
  { id: "internal-link-injector", title: "Internal link injector", goal: "Suggest exact places in old posts to link to a new article.", inputs: "New URL + inventory of related posts (or sitemap notes)", steps: ["Match topical relevance", "Propose anchor + sentence context", "Balance link equity (not spammy)", "List updates prioritized"], output: "Internal link insertion list", tags: ["seo", "architecture"] },
  { id: "orphan-page-rescuer", title: "Orphan page rescuer", goal: "Find pages with no internal links and plan reintegration.", inputs: "Crawl export showing inlinks", steps: ["List orphans", "Map each to a hub/category", "Propose anchors from parent pages", "Prioritize by value"], output: "Rescue plan", tags: ["seo", "architecture"] },
  { id: "topic-cluster-architect", title: "Topic cluster architect", goal: "Design pillar + satellite page structure to own a topic.", inputs: "Core topic + keyword list", steps: ["Define pillar", "Assign satellites", "Map internal links", "Suggest publishing order"], output: "Cluster architecture diagram (markdown)", tags: ["seo", "architecture"] },
  { id: "anchor-text-internal-auditor", title: "Internal anchor text auditor", goal: "Ensure internal anchors are descriptive instead of 'click here'.", inputs: "Internal link export or HTML samples", steps: ["Flag weak anchors", "Propose descriptive replacements", "Check over-optimization of exact match", "Group by template issues"], output: "Anchor fix list", tags: ["seo", "architecture"] },
  { id: "crawl-depth-reducer", title: "Crawl depth reducer", goal: "Find important pages more than ~3 clicks from home and suggest shortcuts.", inputs: "Crawl depth report", steps: ["List deep important URLs", "Propose nav/hub shortcuts", "Avoid bloating global nav", "Prioritize by traffic potential"], output: "Depth reduction plan", tags: ["seo", "architecture"] },
  { id: "silo-structure-planner", title: "Silo structure planner", goal: "Organize large blogs/ecommerce into thematic silos.", inputs: "Category inventory + goals", steps: ["Define silos", "Assign URLs", "Plan cross-silo rules", "Propose URL/nav changes carefully"], output: "Silo map", tags: ["seo", "architecture"] },
  { id: "hub-page-creator", title: "Hub page creator", goal: "Structure hub/index pages that group the best content in a category.", inputs: "Category + candidate URLs", steps: ["Outline hub sections", "Select featured links with blurbs", "Add intro for humans + crawlers", "Suggest internal link pattern"], output: "Hub page outline", tags: ["seo", "architecture"] },
  { id: "footer-nav-link-optimizer", title: "Footer/nav link optimizer", goal: "Audit header/footer links to distribute internal PageRank more effectively.", inputs: "Current nav/footer + priority URLs", steps: ["Identify wasted links", "Propose priority destinations", "Keep UX clear", "Note template constraints"], output: "Nav/footer recommendations", tags: ["seo", "architecture"] },
  { id: "related-posts-matcher", title: "Related posts matcher", goal: "Pick the 3 most semantically relevant posts for end-of-article modules.", inputs: "Current post + candidate list", steps: ["Score topical similarity", "Avoid near-duplicates", "Suggest titles/anchors", "Explain choices"], output: "Top 3 related + reasons", tags: ["seo", "architecture"] },
  { id: "breadcrumb-schema-generator", title: "Breadcrumb schema generator", goal: "Create logical breadcrumb paths and JSON-LD BreadcrumbList markup.", inputs: "URL hierarchy + labels", steps: ["Define crumb trail", "Generate JSON-LD", "Validate logical parents", "Note CMS caveats"], output: "Trail + JSON-LD", tags: ["seo", "schema"] },
  { id: "schema-markup-generator", title: "Schema markup generator", goal: "Generate JSON-LD for Article, FAQPage, Product, LocalBusiness, Review.", inputs: "Page type + field values", steps: ["Choose schema type(s)", "Fill required properties", "Avoid fake reviews/ratings", "Output clean JSON-LD"], output: "JSON-LD block(s)", tags: ["seo", "schema"] },
  { id: "robots-txt-validator", title: "robots.txt validator", goal: "Create or review robots.txt to block junk crawls without blocking vital pages.", inputs: "Current robots.txt + critical URL list", steps: ["Parse rules", "Flag accidental blocks", "Suggest safe disallow patterns", "Remind about sitemap line"], output: "Validated robots.txt draft", tags: ["seo", "technical"] },
  { id: "sitemap-xml-auditor", title: "Sitemap XML auditor", goal: "Compare sitemap URLs vs indexed/crawled pages for 404s, redirects, noindex mistakes.", inputs: "Sitemap URLs + crawl/index notes", steps: ["Find mismatches", "Flag non-200 and noindex in sitemap", "Prioritize fixes", "Suggest split sitemaps if huge"], output: "Sitemap audit report", tags: ["seo", "technical"] },
  { id: "core-web-vitals-diagnoser", title: "Core Web Vitals diagnoser", goal: "Translate PageSpeed/CWV issues into practical engineering tasks.", inputs: "PSI/Lighthouse report notes", steps: ["Map LCP/INP/CLS causes", "Prioritize by impact", "Write tickets for eng", "Avoid generic fluff advice"], output: "Engineering task list", tags: ["seo", "technical"] },
  { id: "hreflang-tag-builder", title: "Hreflang tag builder", goal: "Generate correct hreflang annotations for multi-language/region sites.", inputs: "Locale URL map", steps: ["Build reciprocal hreflang set", "Include x-default if needed", "Check language-region codes", "Warn about mismatches"], output: "Hreflang map + tags", tags: ["seo", "technical"] },
  { id: "canonical-tag-checker", title: "Canonical tag checker", goal: "Find duplicate-content risks from parameters, filters, or pagination.", inputs: "URL samples + canonical headers/tags", steps: ["Detect conflicting canonicals", "Recommend canonical targets", "Handle pagination carefully", "Note parameter handling"], output: "Canonical issues + fixes", tags: ["seo", "technical"] },
  { id: "log-file-analyzer-assistant", title: "Log file analyzer assistant", goal: "Interpret server log samples to show where Googlebot spends crawl budget.", inputs: "Sample access logs (bot filtered if possible)", steps: ["Summarize hit patterns", "Find waste (params, faceted, soft 404)", "Recommend crawl priorities", "Do not invent log lines"], output: "Crawl budget insights", tags: ["seo", "technical"] },
  { id: "js-rendering-seo-checker", title: "JS rendering SEO checker", goal: "Identify critical content/links that depend on JS and may be missed by bots.", inputs: "URL or framework notes + HTML samples", steps: ["Compare raw HTML vs rendered expectations", "Flag client-only content", "Recommend SSR/prerender where needed", "List test steps"], output: "Rendering risk report", tags: ["seo", "technical"] },
  { id: "http-status-code-triage", title: "HTTP status code triage", goal: "Prioritize 4xx/5xx lists from crawlers like Screaming Frog.", inputs: "Status code export", steps: ["Bucket by severity", "Separate soft 404s", "Assign owners/actions", "Propose redirect vs remove"], output: "Prioritized fix queue", tags: ["seo", "technical"] },
  { id: "migration-redirect-mapper", title: "Migration redirect mapper", goal: "Map old→new URLs for domain/CMS migrations with exact 301 plans.", inputs: "Old URL list + new IA", steps: ["1:1 map where possible", "Flag orphans and conflicts", "Generate redirect rules format requested", "Plan post-migration checks"], output: "Redirect map", tags: ["seo", "technical"] },
  { id: "llm-citation-optimizer", title: "LLM citation optimizer", goal: "Structure paragraphs with stats, clear definitions, and sources to improve AI citations.", inputs: "Draft + claim list", steps: ["Add answer-first definitions", "Attach verifiable sources", "Increase fact density ethically", "Format for extractability"], output: "Rewritten citation-ready sections", tags: ["seo", "geo"] },
  { id: "brand-entity-builder", title: "Brand entity builder", goal: "Create consistent brand/founder copy to strengthen Knowledge Graph signals.", inputs: "Company facts + official profiles", steps: ["Write canonical About blurbs", "Align NAP/sameAs candidates", "Avoid unverifiable claims", "Suggest schema Person/Organization fields"], output: "Entity pack", tags: ["seo", "geo"] },
  { id: "ai-overview-snippet-matcher", title: "AI Overview snippet matcher", goal: "Adapt content to fill gaps in AI-generated overview style answers.", inputs: "Query + observed AI overview notes + draft", steps: ["Extract missing facets", "Add concise factual blocks", "Use lists/tables where helpful", "Cite sources"], output: "Gap-fill edits", tags: ["seo", "geo"] },
  { id: "llms-txt-generator", title: "llms.txt generator", goal: "Create /llms.txt guiding LLMs to the site's primary content.", inputs: "Site map of key URLs + summaries", steps: ["List priority docs", "Write concise descriptions", "Keep file maintainable", "Avoid stuffing every URL"], output: "llms.txt draft", tags: ["seo", "geo"] },
  { id: "fact-density-enhancer", title: "Fact density enhancer", goal: "Increase concrete numbers and verifiable citations in opinionated articles.", inputs: "Draft", steps: ["Mark unsupported claims", "Add stats with sources or flag need for research", "Balance narrative vs facts", "Keep readable"], output: "Annotated + denser draft", tags: ["content", "geo"] },
  { id: "reddit-quora-visibility-scout", title: "Reddit/Quora visibility scout", goal: "Find community threads ranking in Google and suggest helpful non-spam answers.", inputs: "Niche + thread notes", steps: ["Identify high-visibility threads", "Draft helpful answers", "Disclose affiliation if promoting", "Avoid spammy links"], output: "Thread list + answer drafts", tags: ["seo", "distribution"] },
  { id: "author-eeat-bio-writer", title: "Author E-E-A-T bio writer", goal: "Write author bios highlighting credentials and official profiles for E-E-A-T.", inputs: "Author CV facts + links", steps: ["Write short and long bios", "List credentials verifiably", "Suggest sameAs links", "Match page language"], output: "Bio pack", tags: ["seo", "eeat"] },
  { id: "co-occurrence-brand-builder", title: "Co-occurrence brand builder", goal: "Identify brands/keywords the business should co-occur with online.", inputs: "Brand + category + competitors", steps: ["List association targets", "Propose content/PR angles", "Avoid fake endorsements", "Prioritize realistic wins"], output: "Association roadmap", tags: ["seo", "geo"] },
  { id: "statistical-page-creator", title: "Statistical page creator", goal: "Structure 'Industry Stats [Year]' pages designed to earn citations.", inputs: "Dataset or source list + year", steps: ["Outline stats page", "Require methodology", "Format quotable stats", "Plan outreach to journalists"], output: "Stats page brief", tags: ["seo", "link-building"] },
  { id: "consensus-claim-verifier", title: "Consensus claim verifier", goal: "Ensure technical claims align with scientific or market consensus.", inputs: "Claims list + domain", steps: ["Flag overconfident claims", "Ask for sources or mark uncertain", "Rewrite cautiously", "Never invent citations"], output: "Verified/rewritten claims", tags: ["content", "eeat"] },
  { id: "gbp-description-optimizer", title: "GBP description optimizer", goal: "Write optimized Google Business Profile descriptions with local service keywords.", inputs: "Business services + city + differentiators", steps: ["Write primary description", "Avoid keyword stuffing", "Include CTA", "Suggest categories"], output: "GBP description + category tips", tags: ["seo", "local"] },
  { id: "review-response-generator", title: "Review response generator", goal: "Craft personalized review responses incorporating local terms naturally.", inputs: "Reviews text + tone policy", steps: ["Respond to positive and negative separately", "Stay professional", "Invite offline resolution for complaints", "Light local relevance without spam"], output: "Response set", tags: ["local"] },
  { id: "local-landing-page-scaler", title: "Local landing page scaler", goal: "Structure unique city/neighborhood pages without doorway duplication.", inputs: "Services + locations + unique local facts", steps: ["Template unique sections", "Require local proof per page", "Plan internal links", "Warn against thin spun pages"], output: "Local page framework", tags: ["seo", "local"] },
  { id: "gbp-post-calendar", title: "GBP post calendar", goal: "Create a monthly GBP posts/offers calendar to keep the local profile active.", inputs: "Offers + seasons + services", steps: ["Plan 4–8 posts", "Write captions + CTAs", "Suggest imagery notes", "Align with promotions"], output: "30-day GBP calendar", tags: ["local"] },
  { id: "nap-consistency-auditor", title: "NAP consistency auditor", goal: "Compare Name/Address/Phone across directories and flag mismatches.", inputs: "Canonical NAP + citation list", steps: ["Diff each listing", "Prioritize high-impact fixes", "Note formatting variants", "Output correction tasks"], output: "NAP mismatch report", tags: ["seo", "local"] },
  { id: "local-qa-seeder", title: "Local Q&A seeder", goal: "List common Q&As to pre-seed on a Google Business Profile.", inputs: "Services + FAQs from customers", steps: ["Compile questions", "Write clear answers", "Avoid fake engagement advice that violates policies", "Prioritize usefulness"], output: "Q&A set", tags: ["local"] },
  { id: "local-competitor-map-spy", title: "Local competitor map spy", goal: "Analyze Local Pack leaders' categories, reviews, and positioning.", inputs: "Business category + 3 competitors", steps: ["Compare categories/reviews", "Note photo/post activity if known", "Extract gaps", "Propose local differentiation"], output: "Local competitive brief", tags: ["seo", "local"] },
  { id: "regex-gsc-builder", title: "Regex GSC builder", goal: "Build ready regexes to filter questions, brands, or intents in Search Console.", inputs: "Filter goals + sample queries", steps: ["Write regex patterns", "Explain matches", "Provide test examples", "Warn about Re2 limits"], output: "Regex library", tags: ["seo", "analytics"] },
  { id: "looker-studio-metric-explainer", title: "Looker Studio metric explainer", goal: "Translate chart spikes/drops into clear executive narratives.", inputs: "Metric changes + context", steps: ["Hypothesize causes with evidence", "Separate seasonality vs incidents", "Recommend next checks", "Write exec summary"], output: "Executive explanation", tags: ["analytics"] },
  { id: "screaming-frog-custom-extractor", title: "Screaming Frog custom extractor", goal: "Generate XPath/CSS extractors for custom crawl fields.", inputs: "Desired fields + sample HTML", steps: ["Propose extractor type", "Write selectors", "Provide fallbacks", "Note SF configuration steps"], output: "Extractor recipes", tags: ["seo", "technical"] },
  { id: "google-sheets-seo-formula-gen", title: "Google Sheets SEO formula gen", goal: "Create QUERY/IMPORTXML/REGEXEXTRACT formulas for SEO spreadsheets.", inputs: "Sheet goals + column layout", steps: ["Write formulas", "Explain each", "Handle errors (#N/A)", "Suggest helper columns"], output: "Formula pack", tags: ["analytics"] },
  { id: "seo-ab-test-designer", title: "SEO A/B test designer", goal: "Design title/layout split tests with hypothesis, control, and success metrics.", inputs: "Page + change idea", steps: ["State hypothesis", "Define variants", "Pick metrics (CTR, conversions)", "Note SEO testing caveats (time, seasonality)"], output: "Test design doc", tags: ["seo", "analytics"] },
  { id: "python-serp-scraper-helper", title: "Python SERP scraper helper", goal: "Write simple Python helpers to collect SERP titles/URLs for pattern analysis — ethically and within ToS.", inputs: "Queries + preferred API or manual export", steps: ["Prefer official APIs / exports over scraping Google HTML", "If coding helpers, keep rate limits and legal notes", "Parse into a tidy table", "Never advise ToS-violating mass scraping"], output: "Script sketch or API workflow", tags: ["seo", "automation"] },
  { id: "monthly-seo-roadmap-builder", title: "Monthly SEO roadmap builder", goal: "Turn a large technical audit into a quarterly action plan by impact×effort.", inputs: "Audit findings list", steps: ["Score impact/effort", "Bucket weeks/sprints", "Assign owners placeholders", "Define success metrics"], output: "Prioritized roadmap", tags: ["seo", "ops"] },
  { id: "roi-traffic-forecaster", title: "ROI traffic forecaster", goal: "Estimate organic traffic potential and paid-media equivalent value for keyword groups.", inputs: "Keywords + volume/CTR assumptions + CPC if known", steps: ["State assumptions clearly", "Compute ranges not false precision", "Map to revenue if conversion rate given", "Call out uncertainty"], output: "Forecast table + assumptions", tags: ["seo", "analytics"] },
];

function existingSlugs() {
  const set = new Set();
  for (const { id, skillPath } of listSkillDirs(path.join(root, "skills"))) {
    set.add(normalizeName(id));
    try {
      const md = readFileSync(path.join(skillPath, "SKILL.md"), "utf8");
      const m = md.match(/^name:\s*(.+)$/m);
      if (m) set.add(normalizeName(m[1]));
    } catch {
      /* ignore */
    }
  }
  // also catalog names
  try {
    const catalog = JSON.parse(readFileSync(path.join(root, "catalog.json"), "utf8"));
    for (const s of catalog.skills || []) {
      set.add(normalizeName(s.id));
      set.add(normalizeName(s.name));
      // namespaced community: ms-seo-audit → seo-audit
      const parts = normalizeName(s.id).split("-");
      if (parts.length > 1) {
        // keep full id; also add suffix after known prefixes
        for (const pref of ["ms", "aaron", "kostja", "claude", "seo", "aitmpl", "ck", "notque"]) {
          if (normalizeName(s.id).startsWith(`${pref}-`)) {
            set.add(normalizeName(s.id).slice(pref.length + 1));
          }
        }
      }
      // claude-seo-seo-backlinks → seo-backlinks
      if (normalizeName(s.id).startsWith("claude-seo-")) {
        set.add(normalizeName(s.id).slice("claude-seo-".length));
      }
    }
  } catch {
    /* ignore */
  }
  return set;
}

function renderSkill(item) {
  const desc = `${item.goal} Use when the user asks for ${item.id.replace(/-/g, " ")}, ${item.tags.join(", ")}, or related SEO/link-building workflows.`;
  const steps = item.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return `---
name: ${item.id}
description: >-
  ${desc}
license: MIT
---

# ${item.title}

## Goal

${item.goal}

## Inputs

${item.inputs}

## Instructions

${steps}

## Output

${item.output}

## Rules

- Do not invent rankings, backlink metrics, or API data you cannot see.
- Prefer official exports/APIs over scraping that violates site ToS.
- No black-hat advice (PBNs, cloaking, fake reviews, spam comments).
- Default language: match the user's content language (pt-BR if they write in Portuguese).
`;
}

const existing = existingSlugs();
let created = 0;
let skipped = 0;
const report = { created: [], skipped: [] };

for (const item of PACK) {
  const id = normalizeName(item.id);
  if (existing.has(id) || existsSync(path.join(ontoomRoot, id, "SKILL.md"))) {
    skipped += 1;
    report.skipped.push(id);
    continue;
  }
  // Also skip if a clear community equivalent exists with same core name
  // (already covered via existing set suffixes)

  const dir = path.join(ontoomRoot, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "SKILL.md"), renderSkill(item), "utf8");
  created += 1;
  report.created.push(id);
  existing.add(id);
}

writeFileSync(
  path.join(root, "staging", `seed-seo-linkbuilding-${new Date().toISOString().slice(0, 10)}.json`),
  JSON.stringify({ created: report.created, skipped: report.skipped, totals: { created, skipped, pack: PACK.length } }, null, 2) + "\n",
  "utf8",
);

console.log(`OK: created ${created}, skipped ${skipped} (pack ${PACK.length})`);
