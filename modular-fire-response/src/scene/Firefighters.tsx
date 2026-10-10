import type { SimulationState, Vec3 } from "../types";
import { FirefighterModel } from "./FirefighterModel";
import { firefighterPoses } from "./firefighterPoses";
import { Tag } from "./ProjectedTag";

export function Firefighters({ state, dogPositions = [], selectedId = "incident", onSelect }: {
  state: SimulationState; dogPositions?: Vec3[]; selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <group name="firefighter-response">
      {firefighterPoses(state, dogPositions).map(person => (
        <group
          key={person.id}
          name={`firefighter-${person.id}`}
          position={person.position}
          rotation={[0, person.heading, 0]}
          scale={1}
          userData={{ role: person.role, action: person.action, duty: person.duty, unitId: person.unitId, carrierId: person.carrierId }}
          onClick={event => { event.stopPropagation(); onSelect?.(person.unitId); }}
        >
          <FirefighterModel role={person.role} action={person.action} time={state.time} />
          {person.unitId === selectedId && person.id !== "ground-support" && (
            <Tag p={[0, 2.65, 0]}>{`${person.title} · ${person.duty}`}</Tag>
          )}
        </group>
      ))}
    </group>
  );
}
