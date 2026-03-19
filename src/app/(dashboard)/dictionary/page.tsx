import { getDictionaryDomains } from "@/features/dictionary/actions/domain-actions";
import { getDictionaryFields } from "@/features/dictionary/actions/field-actions";
import { getDictionaryVersions } from "@/features/dictionary/actions/version-actions";
import { DictionaryPageContent } from "@/features/dictionary/components/dictionary-page-content";

export default async function DictionaryPage() {
  const [domainsResult, fieldsResult, versionsResult] = await Promise.all([
    getDictionaryDomains(),
    getDictionaryFields(),
    getDictionaryVersions(),
  ]);

  return (
    <div className="p-8">
      <DictionaryPageContent
        domains={domainsResult.data ?? []}
        fields={fieldsResult.data ?? []}
        versions={versionsResult.data ?? []}
      />
    </div>
  );
}
