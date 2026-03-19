import { getDictionaryDomains } from "@/features/dictionary/actions/domain-actions";
import { getDictionaryFields } from "@/features/dictionary/actions/field-actions";
import { DictionaryPageContent } from "@/features/dictionary/components/dictionary-page-content";

export default async function DictionaryPage() {
  const [domainsResult, fieldsResult] = await Promise.all([
    getDictionaryDomains(),
    getDictionaryFields(),
  ]);

  return (
    <div className="p-8">
      <DictionaryPageContent
        domains={domainsResult.data ?? []}
        fields={fieldsResult.data ?? []}
        versions={[]}
      />
    </div>
  );
}
