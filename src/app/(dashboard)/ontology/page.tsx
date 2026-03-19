import { getOntologyClasses } from "@/features/ontology/actions/class-actions";
import { OntologyPageContent } from "@/features/ontology/components/ontology-page-content";

export default async function OntologyPage() {
  const { data: classes } = await getOntologyClasses();

  return (
    <div className="p-8">
      <OntologyPageContent classes={classes ?? []} />
    </div>
  );
}
