import PageHeader from "@/components/dashboard/page-header";
import PageHelpButton from "@/components/dashboard/page-help-button";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";

import DocsGuide from "./docs-guide";

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Guide" />
      <div className="px-8 pt-6 pb-8">
        <div className="mb-4 flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tighter text-ink">Guide</h1>
          <PageHelpButton help={DASHBOARD_PAGE_HELP.guide} label="Guide" />
        </div>
        <DocsGuide />
      </div>
    </div>
  );
}
