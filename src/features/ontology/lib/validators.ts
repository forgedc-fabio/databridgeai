/**
 * Ontology validation utilities.
 * Provides circular hierarchy detection for "is-a" relationships.
 */

/**
 * Detects circular hierarchies in "is-a" relationships using DFS.
 * Call BEFORE inserting a new "is-a" relationship.
 *
 * The adjacency model: source_class_id "is-a" target_class_id
 * means source is a subclass of target (source -> target edge).
 *
 * @param sourceClassId - The class that would be the subclass (child)
 * @param targetClassId - The class that would be the superclass (parent)
 * @param existingRelationships - All current "is-a" relationships
 * @param classNameMap - Map of class ID to class name (for error messages)
 * @returns { circular: false } or { circular: true, path: string[] }
 */
export function detectCircularHierarchy(
  sourceClassId: string,
  targetClassId: string,
  existingRelationships: Array<{
    source_class_id: string;
    target_class_id: string;
  }>,
  classNameMap: Map<string, string>
): { circular: false } | { circular: true; path: string[] } {
  // Self-reference is always circular
  if (sourceClassId === targetClassId) {
    const name = classNameMap.get(sourceClassId) ?? sourceClassId;
    return { circular: true, path: [name, name] };
  }

  // Build adjacency list: for each class, which classes is it a subclass of?
  // source_class_id -> [target_class_id, ...]
  const adjacency = new Map<string, string[]>();

  for (const rel of existingRelationships) {
    const existing = adjacency.get(rel.source_class_id) ?? [];
    existing.push(rel.target_class_id);
    adjacency.set(rel.source_class_id, existing);
  }

  // Add the proposed edge
  const existingFromSource = adjacency.get(sourceClassId) ?? [];
  existingFromSource.push(targetClassId);
  adjacency.set(sourceClassId, existingFromSource);

  // DFS from targetClassId following "is-a" edges upward.
  // If we reach sourceClassId, there is a cycle.
  const visited = new Set<string>();
  const pathIds: string[] = [sourceClassId, targetClassId];

  function dfs(current: string): boolean {
    if (current === sourceClassId) {
      return true; // Cycle found
    }

    if (visited.has(current)) {
      return false;
    }
    visited.add(current);

    const neighbours = adjacency.get(current) ?? [];
    for (const next of neighbours) {
      pathIds.push(next);
      if (dfs(next)) {
        return true;
      }
      pathIds.pop();
    }

    return false;
  }

  if (dfs(targetClassId)) {
    // Convert IDs to human-readable names
    const pathNames = pathIds.map(
      (id) => classNameMap.get(id) ?? id
    );
    return { circular: true, path: pathNames };
  }

  return { circular: false };
}
