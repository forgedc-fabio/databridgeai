import { getOntologyClasses } from "@/features/ontology/actions/class-actions";
import { getOntologyRelationships } from "@/features/ontology/actions/relationship-actions";
import { PresentationView } from "@/features/ontology/components/graph/presentation-view";

export default async function VisualisationPage() {
  const [classesResult, relationshipsResult] = await Promise.all([
    getOntologyClasses(),
    getOntologyRelationships(),
  ]);

  return (
    <PresentationView
      classes={classesResult.data ?? []}
      relationships={relationshipsResult.data ?? []}
    />
  );
}
