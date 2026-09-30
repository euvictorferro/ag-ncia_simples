"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, X, FileText } from "lucide-react";
import { buildMockAdCampaigns, buildMockAudiences, type AdStatus, type AdCampaign } from "@/lib/mockClientSocial";

type Tab = "campaigns" | "audiences" | "lead-forms";

const STATUS_STYLE: Record<AdStatus, string> = {
  active: "bg-emerald-400/10 text-emerald-400",
  paused: "bg-yellow-400/10 text-yellow-400",
  rejected: "bg-red-400/10 text-red-400",
  in_review: "bg-blue-400/10 text-blue-400",
};

const STATUS_LABEL: Record<AdStatus, string> = {
  active: "active",
  paused: "paused",
  rejected: "rejected",
  in_review: "in review",
};

function StatusBadge({ status }: { status: AdStatus }) {
  return <span className={`rounded-md px-2 py-0.5 text-xs ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

function CampaignsTab({ clientId }: { clientId: string }) {
  const [campaigns] = useState<AdCampaign[]>(() => buildMockAdCampaigns(clientId));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totals = campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      conversions: acc.conversions + c.conversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Spend", `$${totals.spend.toFixed(2)}`],
          ["Impressions", totals.impressions.toLocaleString("pt-BR")],
          ["Clicks", totals.clicks.toLocaleString("pt-BR")],
          ["Conversions", totals.conversions.toLocaleString("pt-BR")],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-[var(--radius-card)] border border-border bg-background-elevated p-3">
            <p className="text-lg font-semibold text-foreground-strong">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="py-2 pl-3 pr-3">Name</th>
              <th className="px-3">Status</th>
              <th className="px-3">Budget</th>
              <th className="px-3">Spend</th>
              <th className="px-3">Impressions</th>
              <th className="px-3">Clicks</th>
              <th className="pr-3">Conversions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <Fragment key={campaign.id}>
                <tr className="border-b border-border/60 last:border-0">
                  <td className="py-2 pl-3 pr-3">
                    <button
                      type="button"
                      onClick={() => toggle(campaign.id)}
                      className="flex items-center gap-1.5 text-foreground"
                    >
                      {expanded.has(campaign.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {campaign.name}
                    </button>
                  </td>
                  <td className="px-3">
                    <StatusBadge status={campaign.status} />
                  </td>
                  <td className="px-3 text-muted-foreground">${campaign.budgetPerDay.toFixed(2)}/day</td>
                  <td className="px-3 text-muted-foreground">${campaign.spend.toFixed(2)}</td>
                  <td className="px-3 text-muted-foreground">{campaign.impressions.toLocaleString("pt-BR")}</td>
                  <td className="px-3 text-muted-foreground">{campaign.clicks}</td>
                  <td className="pr-3 text-muted-foreground">{campaign.conversions}</td>
                </tr>
                {expanded.has(campaign.id) &&
                  campaign.adSets.map((adSet) => (
                    <Fragment key={adSet.id}>
                      <tr className="border-b border-border/60 bg-muted/20 last:border-0">
                        <td className="py-1.5 pl-8 pr-3 text-foreground">{adSet.name}</td>
                        <td className="px-3">
                          <StatusBadge status={adSet.status} />
                        </td>
                        <td className="px-3 text-muted-foreground" colSpan={4}>
                          Ad Set
                        </td>
                      </tr>
                      {adSet.ads.map((ad) => (
                        <tr key={ad.id} className="border-b border-border/60 last:border-0">
                          <td className="py-1.5 pl-14 pr-3 text-muted-foreground">{ad.name}</td>
                          <td className="px-3">
                            <StatusBadge status={ad.status} />
                          </td>
                          <td className="px-3 text-muted-foreground" colSpan={4}>
                            Ad
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AudiencesTab({ clientId }: { clientId: string }) {
  const [audiences] = useState(() => buildMockAudiences(clientId));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{audiences.length} audiences</p>
      </div>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="py-2 pl-3 pr-3">Audience</th>
              <th className="px-3">Type</th>
              <th className="px-3">Size</th>
              <th className="pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {audiences.map((audience) => (
              <tr key={audience.id} className="border-b border-border/60 last:border-0">
                <td className="py-2 pl-3 pr-3 text-foreground">{audience.name}</td>
                <td className="px-3 text-muted-foreground">{audience.type}</td>
                <td className="px-3 text-muted-foreground">{audience.size.toLocaleString("pt-BR")}</td>
                <td className="pr-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs ${
                      audience.status === "ready" ? "bg-emerald-400/10 text-emerald-400" : "bg-yellow-400/10 text-yellow-400"
                    }`}
                  >
                    {audience.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewFormModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground-strong">New lead form</h2>
            <p className="text-xs text-muted-foreground">Creates a Meta Instant Form on the selected Facebook Page.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Form name</label>
          <input
            placeholder="Summer launch signup"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Questions</label>
          <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong">
            <option>Email only</option>
            <option>Email + phone</option>
            <option>Custom</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Privacy policy URL</label>
          <input
            placeholder="https://example.com/privacy"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Thank you message</label>
          <input
            placeholder="We'll be in touch soon."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">
            Cancel
          </button>
          <button type="button" onClick={onClose} className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground">
            + Create form
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadFormsTab() {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-border bg-background-elevated py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileText size={20} />
      </span>
      <p className="text-sm font-semibold text-foreground-strong">No lead forms yet</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        No Instant Forms on your Facebook Pages. Click New form to create one.
      </p>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="mt-2 rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
      >
        + New form
      </button>
      {showModal && <NewFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "campaigns", label: "Campaigns" },
  { key: "audiences", label: "Audiences" },
  { key: "lead-forms", label: "Lead Forms" },
];

export function AdsExplorer({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState<Tab>("campaigns");

  return (
    <div className="space-y-4">
      <div className="flex gap-4 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-1 pb-2 text-sm ${
              tab === t.key ? "border-foreground-strong text-foreground-strong" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        <h1 className="text-xl font-semibold text-foreground-strong">Ads</h1>
        <p className="text-sm text-muted-foreground">Manage boosted post ads</p>
      </div>

      {tab === "campaigns" && <CampaignsTab clientId={clientId} />}
      {tab === "audiences" && <AudiencesTab clientId={clientId} />}
      {tab === "lead-forms" && <LeadFormsTab />}
    </div>
  );
}
