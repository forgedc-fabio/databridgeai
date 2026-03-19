import { getDictionaryDomains } from "@/features/dictionary/actions/domain-actions";
import { getDictionaryFields } from "@/features/dictionary/actions/field-actions";
import { getAllConcatenatedRefs } from "@/features/dictionary/actions/value-actions";
import { PresentationView } from "@/features/dictionary/components/visualisation/presentation-view";

export default async function DictionaryVisualisationPage() {
  const [domainsResult, fieldsResult, refsResult] = await Promise.all([
    getDictionaryDomains(),
    getDictionaryFields(),
    getAllConcatenatedRefs(),
  ]);

  return (
    <PresentationView
      domains={domainsResult.data ?? []}
      fields={fieldsResult.data ?? []}
      concatenatedRefs={refsResult.data ?? []}
    />
  );
}
