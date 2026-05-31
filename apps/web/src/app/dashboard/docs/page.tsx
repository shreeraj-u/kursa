import PageHeader from "@/components/dashboard/page-header";

import DocsGuide from "./docs-guide";

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Guide" />
      <div className="px-8 pt-6 pb-8">
        <DocsGuide />
      </div>
    </div>
  );
}
